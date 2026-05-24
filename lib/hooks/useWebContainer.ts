import { WebContainer } from "@webcontainer/api";
import { useEffect, useState, useRef, Dispatch, SetStateAction } from "react";
import { WorkspaceFile, WorkspaceFolder } from "@/lib/types";
import { detectLanguage, uid } from "@/lib/utils";

let webcontainerPromise: Promise<WebContainer> | null = null;

const IGNORED_FOLDERS = ["node_modules", ".git", ".next", "dist", "build"];

export function useWebContainer(
  files: WorkspaceFile[], 
  folders: WorkspaceFolder[], 
  setFiles: Dispatch<SetStateAction<WorkspaceFile[]>>, 
  setFolders: Dispatch<SetStateAction<WorkspaceFolder[]>>
) {
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [booting, setBooting] = useState(false);
  const isSyncingFromContainer = useRef(false);

  // Boot WebContainer instance
  useEffect(() => {
    async function boot() {
      if (webcontainerPromise) {
        const inst = await webcontainerPromise;
        setInstance(inst);
        return;
      }
      
      setBooting(true);
      try {
        webcontainerPromise = WebContainer.boot();
        const inst = await webcontainerPromise;
        setInstance(inst);
      } catch (error) {
        console.error("Failed to boot WebContainer:", error);
        webcontainerPromise = null;
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []);

  // Initial mount: Write current files/folders in state to the container filesystem
  useEffect(() => {
    if (!instance || files.length === 0) return;

    async function initialMount() {
      if (isSyncingFromContainer.current) return;
      try {
        const tree = buildFileTree(files, folders);
        await instance!.mount(tree);
      } catch (err) {
        console.error("Initial WebContainer mount failed:", err);
      }
    }

    initialMount();
  }, [instance]);

  // Sync React state changes to WebContainer filesystem (bidirectional sync helper)
  const prevFilesRef = useRef<WorkspaceFile[]>(files);
  const prevFoldersRef = useRef<WorkspaceFolder[]>(folders);

  useEffect(() => {
    if (!instance) return;
    if (isSyncingFromContainer.current) {
      prevFilesRef.current = files;
      prevFoldersRef.current = folders;
      return;
    }

    async function syncChangesToContainer() {
      // 1. Sync file updates/creations
      for (const file of files) {
        const prev = prevFilesRef.current.find(f => f.id === file.id);
        if (!prev || prev.content !== file.content || prev.name !== file.name || prev.parentId !== file.parentId) {
          const filePath = getWorkspacePath(file.id, files, folders);
          if (filePath) {
            try {
              const dirParts = filePath.split("/");
              dirParts.pop();
              if (dirParts.length > 0) {
                await instance!.fs.mkdir(dirParts.join("/"), { recursive: true });
              }
              await instance!.fs.writeFile(filePath, file.content);
            } catch (err) {
              console.error(`Sync error writing ${filePath} to WebContainer:`, err);
            }
          }
        }
      }

      // 2. Sync folder creations
      for (const folder of folders) {
        const prev = prevFoldersRef.current.find(f => f.id === folder.id);
        if (!prev) {
          const folderPath = getFolderPath(folder.id, folders);
          if (folderPath) {
            try {
              await instance!.fs.mkdir(folderPath, { recursive: true });
            } catch (err) {
              console.error(`Sync error creating directory ${folderPath} in WebContainer:`, err);
            }
          }
        }
      }

      // 3. Sync file deletions
      for (const prev of prevFilesRef.current) {
        if (!files.some(f => f.id === prev.id)) {
          const filePath = getWorkspacePath(prev.id, prevFilesRef.current, prevFoldersRef.current);
          if (filePath) {
            try {
              await instance!.fs.rm(filePath);
            } catch (err) {
              // File might already be removed inside container
            }
          }
        }
      }

      // 4. Sync folder deletions
      for (const prev of prevFoldersRef.current) {
        if (!folders.some(f => f.id === prev.id)) {
          const folderPath = getFolderPath(prev.id, prevFoldersRef.current);
          if (folderPath) {
            try {
              await instance!.fs.rm(folderPath, { recursive: true });
            } catch (err) {
              // Folder might already be removed
            }
          }
        }
      }

      prevFilesRef.current = files;
      prevFoldersRef.current = folders;
    }

    syncChangesToContainer();
  }, [files, folders, instance]);

  // Sync changes from WebContainer back to React state using fast polling (delta check)
  useEffect(() => {
    if (!instance) return;

    let interval: NodeJS.Timeout;
    const syncFromContainer = async () => {
      if (isSyncingFromContainer.current) return;
      isSyncingFromContainer.current = true;

      try {
        const tree = await readWebContainerRecursive(instance!, "");
        const containerItems = flattenTreeWithPath(tree);

        // Map React items paths to IDs
        const { folderPaths, filePaths } = getReactPathMap(prevFilesRef.current, prevFoldersRef.current);

        const pathToFolderId = new Map<string, string>();
        folderPaths.forEach((path, id) => pathToFolderId.set(path, id));

        const finalFolders: WorkspaceFolder[] = [];
        const finalFiles: WorkspaceFile[] = [];

        // 1. Assign IDs to directories
        const containerDirs = containerItems.filter(item => item.isDirectory);
        containerDirs.forEach(dir => {
          let id = pathToFolderId.get(dir.path);
          if (!id) {
            id = `dir_${uid("folder")}`;
            pathToFolderId.set(dir.path, id);
          }
          
          const parts = dir.path.split("/");
          parts.pop();
          const parentPath = parts.join("/");
          const parentId = parentPath ? pathToFolderId.get(parentPath) || null : null;
          const name = dir.path.split("/").pop()!;

          finalFolders.push({
            id,
            parentId,
            name,
            createdAt: new Date().toISOString()
          });
        });

        // 2. Assign IDs to files
        const containerFiles = containerItems.filter(item => !item.isDirectory);
        containerFiles.forEach(file => {
          let id = "";
          filePaths.forEach((path, fileId) => {
            if (path === file.path) id = fileId;
          });
          if (!id) {
            id = `file_${uid("file")}`;
          }

          const parts = file.path.split("/");
          parts.pop();
          const parentPath = parts.join("/");
          const parentId = parentPath ? pathToFolderId.get(parentPath) || null : null;
          const name = file.path.split("/").pop()!;

          finalFiles.push({
            id,
            parentId,
            name,
            language: detectLanguage(name),
            content: file.content || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });

        // Check if anything has changed before updating state
        const filesChanged = files.length !== finalFiles.length || 
          finalFiles.some(ff => {
            const pf = files.find(f => f.id === ff.id);
            return !pf || pf.content !== ff.content || pf.name !== ff.name || pf.parentId !== ff.parentId;
          });

        const foldersChanged = folders.length !== finalFolders.length || 
          finalFolders.some(ff => {
            const pf = folders.find(f => f.id === ff.id);
            return !pf || pf.name !== ff.name || pf.parentId !== ff.parentId;
          });

        if (filesChanged) {
          setFiles(finalFiles);
        }
        if (foldersChanged) {
          setFolders(finalFolders);
        }
      } catch (err) {
        console.error("Failed to sync file system changes from WebContainer:", err);
      } finally {
        isSyncingFromContainer.current = false;
      }
    };

    // Run sync scanner every 3 seconds (light-weight — ignored folders are skipped)
    interval = setInterval(syncFromContainer, 3000);

    return () => clearInterval(interval);
  }, [instance]); // Only restart when instance changes, not on every file edit

  return { instance, booting };
}

// Helper to recursively read WebContainer filesystem, ignoring heavy folders
async function readWebContainerRecursive(instance: WebContainer, path: string): Promise<any> {
  try {
    const entries = await instance.fs.readdir(path, { withFileTypes: true });
    const result: any = {};

    for (const entry of entries) {
      const fullPath = path ? `${path}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (IGNORED_FOLDERS.includes(entry.name)) {
          result[entry.name] = { directory: {} };
        } else {
          result[entry.name] = {
            directory: await readWebContainerRecursive(instance, fullPath)
          };
        }
      } else {
        const contents = await instance.fs.readFile(fullPath, "utf-8");
        result[entry.name] = {
          file: { contents }
        };
      }
    }
    return result;
  } catch (err) {
    console.error(`Error reading WebContainer directory ${path}:`, err);
    return {};
  }
}

// Helper to flatten path-based directory tree from WebContainer
function flattenTreeWithPath(tree: any, currentPath: string = ""): Array<{ path: string, content?: string, isDirectory: boolean }> {
  let items: Array<{ path: string, content?: string, isDirectory: boolean }> = [];
  
  Object.entries(tree).forEach(([name, node]: [string, any]) => {
    const itemPath = currentPath ? `${currentPath}/${name}` : name;
    if (node.directory) {
      items.push({ path: itemPath, isDirectory: true });
      items = [...items, ...flattenTreeWithPath(node.directory, itemPath)];
    } else {
      items.push({ path: itemPath, content: node.file.contents, isDirectory: false });
    }
  });
  
  return items;
}

// Helper to construct path mapping of current UI state
function getReactPathMap(files: WorkspaceFile[], folders: WorkspaceFolder[]) {
  const folderPaths = new Map<string, string>(); // id -> path
  
  function getFolderReactPath(folderId: string): string {
    if (folderPaths.has(folderId)) return folderPaths.get(folderId)!;
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return "";
    const parentPath = folder.parentId ? getFolderReactPath(folder.parentId) : "";
    const fullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
    folderPaths.set(folderId, fullPath);
    return fullPath;
  }
  
  folders.forEach(f => getFolderReactPath(f.id));
  
  const filePaths = new Map<string, string>(); // fileId -> path
  files.forEach(file => {
    const parentPath = file.parentId ? getFolderReactPath(file.parentId) : "";
    const fullPath = parentPath ? `${parentPath}/${file.name}` : file.name;
    filePaths.set(file.id, fullPath);
  });
  
  return { folderPaths, filePaths };
}

// Helpers to get workspace path string for file or folder ID
function getWorkspacePath(fileId: string, files: WorkspaceFile[], folders: WorkspaceFolder[]): string {
  const file = files.find(f => f.id === fileId);
  if (!file) return "";
  
  const pathParts = [file.name];
  let currentParentId = file.parentId;
  
  while (currentParentId) {
    const folder = folders.find(f => f.id === currentParentId);
    if (folder) {
      pathParts.unshift(folder.name);
      currentParentId = folder.parentId;
    } else {
      break;
    }
  }
  
  return pathParts.join("/");
}

function getFolderPath(folderId: string, folders: WorkspaceFolder[]): string {
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return "";
  
  const pathParts = [folder.name];
  let currentParentId = folder.parentId;
  
  while (currentParentId) {
    const parentFolder = folders.find(f => f.id === currentParentId);
    if (parentFolder) {
      pathParts.unshift(parentFolder.name);
      currentParentId = parentFolder.parentId;
    } else {
      break;
    }
  }
  
  return pathParts.join("/");
}

// Helper to build file tree structure for WebContainer mount
function buildFileTree(files: WorkspaceFile[], folders: WorkspaceFolder[]) {
  const tree: any = {};
  const folderMap = new Map<string, any>();
  
  folders.forEach(folder => {
    folderMap.set(folder.id, { directory: {} });
  });

  folders.forEach(folder => {
    const node = folderMap.get(folder.id);
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId).directory[folder.name] = node;
    } else {
      tree[folder.name] = node;
    }
  });

  files.forEach(file => {
    const fileNode = { file: { contents: file.content } };
    if (file.parentId && folderMap.has(file.parentId)) {
      folderMap.get(file.parentId).directory[file.name] = fileNode;
    } else {
      tree[file.name] = fileNode;
    }
  });

  return tree;
}
