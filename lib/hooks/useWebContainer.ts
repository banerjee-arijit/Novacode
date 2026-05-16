import { WebContainer } from "@webcontainer/api";
import { useEffect, useState, useRef, Dispatch, SetStateAction } from "react";
import { WorkspaceFile, WorkspaceFolder } from "@/lib/types";
import { detectLanguage } from "@/lib/utils";

let webcontainerPromise: Promise<WebContainer> | null = null;

export function useWebContainer(
  files: WorkspaceFile[], 
  folders: WorkspaceFolder[], 
  setFiles: Dispatch<SetStateAction<WorkspaceFile[]>>, 
  setFolders: Dispatch<SetStateAction<WorkspaceFolder[]>>
) {
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [booting, setBooting] = useState(false);
  const isSyncingFromContainer = useRef(false);

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

  // Initial mount
  useEffect(() => {
    if (!instance || files.length === 0) return;

    async function initialMount() {
      if (isSyncingFromContainer.current) return;
      const tree = buildFileTree(files, folders);
      await instance!.mount(tree);
    }

    initialMount();
  }, [instance]);

  // Watch for changes in WebContainer and sync back to UI
  useEffect(() => {
    if (!instance) return;

    let timeout: NodeJS.Timeout;
    const watch = async () => {
      try {
        // Simple polling for now as recursive watch can be unstable/heavy
        // In a real app, we'd use a more sophisticated watcher or event-based sync
        const syncFromContainer = async () => {
          if (isSyncingFromContainer.current) return;
          
          const tree = await readWebContainerRecursive(instance!, "");
          
          // Only update if something actually changed (simplified check)
          // We'll update the flat state based on the path tree
          const { newFiles, newFolders } = flattenTree(tree);
          
          // To avoid infinite loops, we only set if different
          // (This is a simplified implementation)
          setFiles(prev => JSON.stringify(prev) !== JSON.stringify(newFiles) ? newFiles : prev);
          setFolders(prev => JSON.stringify(prev) !== JSON.stringify(newFolders) ? newFolders : prev);
        };

        // We can't easily watch everything recursively with perfect stability yet, 
        // but we can trigger a sync after commands finish or on a slow interval
        timeout = setInterval(syncFromContainer, 3000);
      } catch (err) {
        console.error("Watch error:", err);
      }
    };

    watch();
    return () => clearInterval(timeout);
  }, [instance]);

  return { instance, booting };
}

async function readWebContainerRecursive(instance: WebContainer, path: string): Promise<any> {
  const entries = await instance.fs.readdir(path, { withFileTypes: true });
  const result: any = {};

  for (const entry of entries) {
    const fullPath = path ? `${path}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      result[entry.name] = {
        directory: await readWebContainerRecursive(instance, fullPath)
      };
    } else {
      const contents = await instance.fs.readFile(fullPath, "utf-8");
      result[entry.name] = {
        file: { contents }
      };
    }
  }
  return result;
}

function flattenTree(tree: any, parentId: string | null = null): { newFiles: WorkspaceFile[], newFolders: WorkspaceFolder[] } {
  let newFiles: WorkspaceFile[] = [];
  let newFolders: WorkspaceFolder[] = [];

  Object.entries(tree).forEach(([name, node]: [string, any]) => {
    const id = `${parentId || 'root'}_${name}`;
    if (node.directory) {
      newFolders.push({
        id,
        parentId,
        name,
        createdAt: new Date().toISOString()
      });
      const children = flattenTree(node.directory, id);
      newFiles = [...newFiles, ...children.newFiles];
      newFolders = [...newFolders, ...children.newFolders];
    } else {
      newFiles.push({
        id,
        parentId,
        name,
        language: detectLanguage(name),
        content: node.file.contents,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  return { newFiles, newFolders };
}

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

