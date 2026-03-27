import { useState, useRef, useEffect } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import { Plus, Trash2, AlertCircle, Download, Upload, Target, ZoomIn, ZoomOut, RotateCcw, GitBranch, Undo2, Redo2, ChevronDown, ChevronRight, Copy, Magnet, Maximize, Minimize } from 'lucide-react';

// 1. Definisikan Tipe Data (Interface) untuk Node Mind Map
interface MindNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  color?: string; // Properti warna kustom
  isCollapsed?: boolean; // Status lipat cabang
}

export default function App() {
  const [nodes, setNodes] = useState<MindNode[]>([
    { id: 'root', text: 'Ide Utama', x: 1500, y: 1500, parentId: null }
  ]);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('root');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [message, setMessage] = useState<string>('');

  const [history, setHistory] = useState<MindNode[][]>([[ { id: 'root', text: 'Ide Utama', x: 1500, y: 1500, parentId: null } ]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [zoom, setZoom] = useState<number>(1);
  const [lineStyle, setLineStyle] = useState<'curve' | 'straight'>('curve');

  // --- FITUR BARU: Lacak Node Terakhir untuk Fokus Zoom ---
  const [lastSelectedNodeId, setLastSelectedNodeId] = useState<string>('root');
  
  useEffect(() => {
    if (selectedNodeId) {
      setLastSelectedNodeId(selectedNodeId);
    }
  }, [selectedNodeId]);

  // --- FITUR BARU: State untuk Snap to Grid dan Focus Mode ---
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('mindmap-autosave');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setNodes(parsed);
        setHistory([parsed]); 
        setHistoryIndex(0);
      } catch (e) {
        console.error('Gagal memuat auto-save');
      }
    }
    
    if (wrapperRef.current) {
      wrapperRef.current.scrollLeft = 1500 - window.innerWidth / 2;
      wrapperRef.current.scrollTop = 1500 - window.innerHeight / 2;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mindmap-autosave', JSON.stringify(nodes));
  }, [nodes]);

  const saveHistory = (newNodes: MindNode[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newNodes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setNodes(newNodes);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodes(history[historyIndex - 1]);
      setSelectedNodeId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodes(history[historyIndex + 1]);
      setSelectedNodeId(null);
    }
  };

  const handleNodeMouseDown = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (isFocusMode) return; // Nonaktifkan interaksi drag di Focus Mode
    
    const node = nodes.find(n => n.id === id);
    if (!node || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    
    setDragOffset({ x: mouseX - node.x, y: mouseY - node.y });
    setDraggingNodeId(id);
    setSelectedNodeId(id);
    setMessage('');
  };

  const handleCanvasMouseDown = () => {
    if (isFocusMode) return;
    setSelectedNodeId(null);
    setEditingNodeId(null);
    setMessage('');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingNodeId || !containerRef.current || isFocusMode) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    let newX = Math.max(50, Math.min(2950, mouseX - dragOffset.x));
    let newY = Math.max(50, Math.min(2950, mouseY - dragOffset.y));

    // FITUR BARU: Logika Snap to Grid (Kelipatan 24px sesuai dengan background grid)
    if (snapToGrid) {
      newX = Math.round(newX / 24) * 24;
      newY = Math.round(newY / 24) * 24;
    }

    setNodes(nodes.map(n => 
      n.id === draggingNodeId 
        ? { ...n, x: newX, y: newY } 
        : n
    ));
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      saveHistory(nodes);
    }
    setDraggingNodeId(null);
  };

  const handleColorChange = (color: string) => {
    if (!selectedNodeId) return;
    saveHistory(nodes.map(n => n.id === selectedNodeId ? { ...n, color } : n));
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mindmap_ku.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setMessage('Mind Map berhasil diunduh ke komputer!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedNodes = JSON.parse(event.target?.result as string);
        saveHistory(importedNodes);
        setMessage('Mind Map berhasil dimuat!');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage('Gagal memuat file. Pastikan itu file JSON Mind Map yang valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  // --- FITUR BARU: Fungsi Zoom Dinamis dengan Fokus Kamera ---
  const handleZoom = (direction: 'in' | 'out') => {
    let newZoom = zoom + (direction === 'in' ? 0.1 : -0.1);
    newZoom = Math.max(0.3, Math.min(newZoom, 2));
    
    setZoom(newZoom);
    
    // Fokuskan kamera ke node yang aktif atau terakhir aktif
    const targetId = selectedNodeId || lastSelectedNodeId;
    const targetNode = nodes.find(n => n.id === targetId) || nodes[0];
    
    if (targetNode && wrapperRef.current) {
      setTimeout(() => {
        wrapperRef.current?.scrollTo({
          left: (targetNode.x * newZoom) - window.innerWidth / 2,
          top: (targetNode.y * newZoom) - window.innerHeight / 2,
          behavior: 'smooth'
        });
      }, 10);
    }
  };

  const handleRecenter = () => {
    // Tombol target sekarang juga berpusat pada node aktif, bukan sekadar tengah absolut
    const targetId = selectedNodeId || lastSelectedNodeId;
    const targetNode = nodes.find(n => n.id === targetId) || nodes.find(n => n.id === 'root');

    if (targetNode && wrapperRef.current) {
      wrapperRef.current.scrollTo({
        left: (targetNode.x * zoom) - window.innerWidth / 2,
        top: (targetNode.y * zoom) - window.innerHeight / 2,
        behavior: 'smooth'
      });
    }
  };

  const handleAddRoot = () => {
    let spawnX = 1500;
    let spawnY = 1500;
    
    if (selectedNodeId) {
      const selected = nodes.find(n => n.id === selectedNodeId);
      if (selected) {
        spawnX = selected.x + 300;
        spawnY = selected.y;
      }
    }
    
    if (snapToGrid) {
      spawnX = Math.round(spawnX / 24) * 24;
      spawnY = Math.round(spawnY / 24) * 24;
    }
    
    const newRoot: MindNode = {
      id: Date.now().toString(),
      text: 'Topik Baru',
      x: spawnX,
      y: spawnY,
      parentId: null
    };
    
    saveHistory([...nodes, newRoot]);
    setSelectedNodeId(newRoot.id);
    setEditingNodeId(newRoot.id);
    setMessage('');
  };

  const handleAddChild = () => {
    if (!selectedNodeId) {
      setMessage('Pilih node terlebih dahulu untuk menambahkan cabang.');
      return;
    }
    const parent = nodes.find(n => n.id === selectedNodeId);
    if (!parent) return; 

    let currentNodes = nodes;
    if (parent.isCollapsed) {
      currentNodes = currentNodes.map(n => n.id === parent.id ? { ...n, isCollapsed: false } : n);
    }

    let spawnX = parent.x + 200;
    let spawnY = parent.y + (Math.random() * 100 - 50);

    if (snapToGrid) {
      spawnX = Math.round(spawnX / 24) * 24;
      spawnY = Math.round(spawnY / 24) * 24;
    }

    const newNode: MindNode = {
      id: Date.now().toString(),
      text: 'Ide Baru',
      x: spawnX,
      y: spawnY,
      parentId: parent.id
    };
    
    saveHistory([...currentNodes, newNode]);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
    setMessage('');
  };

  // --- FITUR BARU: Logika Duplikasi Node & Cabangnya ---
  const handleDuplicateNode = () => {
    if (!selectedNodeId) return;

    const originalNode = nodes.find(n => n.id === selectedNodeId);
    if (!originalNode) return;

    const newNodes: MindNode[] = [];
    const traverseAndClone = (nodeId: string, newParentId: string | null) => {
      const target = nodes.find(n => n.id === nodeId);
      if (!target) return;
      
      // Buat ID baru yang unik (menggunakan Date.now + random agar aman dalam loop cepat)
      const newId = Date.now().toString() + Math.random().toString().slice(2, 6);
      
      // Cek apakah ini adalah node paling atas yang sedang diduplikasi
      const isTopLevelClone = (nodeId === selectedNodeId);

      newNodes.push({
        ...target,
        id: newId,
        parentId: newParentId,
        // Geser sedikit ke bawah/kanan agar tidak menumpuk sempurna dengan aslinya
        x: target.x + (isTopLevelClone ? 48 : 0),
        y: target.y + (isTopLevelClone ? 48 : 0),
      });

      const children = nodes.filter(n => n.parentId === nodeId);
      children.forEach(c => traverseAndClone(c.id, newId));
    };

    traverseAndClone(originalNode.id, originalNode.parentId);
    saveHistory([...nodes, ...newNodes]);
    setMessage('Cabang berhasil diduplikasi!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCanvasDoubleClick = (e: MouseEvent) => {
    if (!containerRef.current || isFocusMode) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) / zoom;
    let mouseY = (e.clientY - rect.top) / zoom;

    if (snapToGrid) {
      mouseX = Math.round(mouseX / 24) * 24;
      mouseY = Math.round(mouseY / 24) * 24;
    }

    const newRoot: MindNode = {
      id: Date.now().toString(),
      text: 'Topik Baru',
      x: mouseX,
      y: mouseY,
      parentId: null
    };
    
    saveHistory([...nodes, newRoot]);
    setSelectedNodeId(newRoot.id);
    setEditingNodeId(newRoot.id);
    setMessage('');
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    
    if (nodes.length === 1) {
      setMessage('Tidak dapat menghapus satu-satunya node di kanvas.');
      return;
    }
    
    const getDescendants = (id: string, allNodes: MindNode[]): MindNode[] => {
      const children = allNodes.filter(n => n.parentId === id);
      let descendants = [...children];
      children.forEach(c => {
        descendants = [...descendants, ...getDescendants(c.id, allNodes)];
      });
      return descendants;
    };
    
    const toDelete = [selectedNodeId, ...getDescendants(selectedNodeId, nodes).map(n => n.id)];
    saveHistory(nodes.filter(n => !toDelete.includes(n.id)));
    setSelectedNodeId(null);
    setMessage('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNodeId) return;
      
      // Keluar dari Focus Mode dengan tombol Escape
      if (e.key === 'Escape') {
        setIsFocusMode(false);
      }

      if (isFocusMode) return; // Matikan shortcut lain saat presentasi
      
      // Shortcut Zoom (Ctrl + / Ctrl -)
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoom('in');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoom('out');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateNode(); // Shortcut duplikasi
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteNode();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleAddChild();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, editingNodeId, history, historyIndex, isFocusMode, zoom, lastSelectedNodeId]);

  const handleReset = () => {
    if (window.confirm('Anda yakin ingin menghapus semua dan memulai dari awal?')) {
      saveHistory([{ id: 'root', text: 'Ide Utama', x: 1500, y: 1500, parentId: null }]);
      setSelectedNodeId('root');
      setZoom(1);
    }
  };

  const toggleCollapse = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    saveHistory(nodes.map(n => n.id === id ? { ...n, isCollapsed: !n.isCollapsed } : n));
  };

  const getVisibleNodes = () => {
    const visible = new Set<string>();
    const traverse = (nodeId: string, isVisible: boolean) => {
      if (isVisible) visible.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      const children = nodes.filter(n => n.parentId === nodeId);
      children.forEach(child => {
        traverse(child.id, isVisible && !node?.isCollapsed);
      });
    };
    
    const rootNodes = nodes.filter(n => n.parentId === null);
    rootNodes.forEach(root => traverse(root.id, true));
    
    return nodes.filter(n => visible.has(n.id));
  };
  
  const visibleNodes = getVisibleNodes();

  const renderLine = (parent: MindNode, child: MindNode) => {
    const dx = child.x - parent.x;
    const controlPointX1 = parent.x + dx * 0.5;
    const controlPointY1 = parent.y;
    const controlPointX2 = child.x - dx * 0.5;
    const controlPointY2 = child.y;

    const path = lineStyle === 'curve'
      ? `M ${parent.x} ${parent.y} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${child.x} ${child.y}`
      : `M ${parent.x} ${parent.y} L ${child.x} ${child.y}`;

    const lineColor = child.color || '#cbd5e1';

    return (
      <path 
        key={`line-${child.id}`}
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth="3"
        strokeLinecap="round"
        className="transition-colors duration-300"
      />
    );
  };

  const PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'];

  return (
    <div className="flex flex-col w-full h-screen font-sans overflow-hidden bg-slate-100 relative">
      
      {/* Tombol Keluar Focus Mode (Hanya muncul saat presentasi) */}
      {isFocusMode && (
        <button 
          onClick={() => setIsFocusMode(false)}
          className="absolute top-6 right-6 z-50 bg-slate-800/80 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-lg hover:bg-slate-700 flex items-center gap-2 transition-all animate-in fade-in zoom-in"
        >
          <Minimize size={18} /> Keluar Presentasi
        </button>
      )}

      {/* Toolbar Atas (Sembunyikan saat Focus Mode) */}
      {!isFocusMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-2 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2 z-20 overflow-x-auto max-w-full">
          <button onClick={handleUndo} disabled={historyIndex === 0} title="Batal (Ctrl+Z)" className="p-2 hover:bg-slate-100 disabled:opacity-30 text-slate-600 rounded-xl transition-colors">
            <Undo2 size={18} />
          </button>
          <button onClick={handleRedo} disabled={historyIndex === history.length - 1} title="Ulangi (Ctrl+Y)" className="p-2 hover:bg-slate-100 disabled:opacity-30 text-slate-600 rounded-xl transition-colors">
            <Redo2 size={18} />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <button onClick={handleAddRoot} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-xl transition-colors text-sm font-semibold text-blue-700 whitespace-nowrap" title="Tambah Ide Utama Mandiri">
            <Plus size={18} /> Topik Baru
          </button>
          <button onClick={handleAddChild} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-xl transition-colors text-sm font-semibold text-slate-700 whitespace-nowrap">
            <Plus size={18} /> Cabang
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          
          {/* Tombol Fitur Baru */}
          <button onClick={handleDuplicateNode} title="Duplikat Cabang (Ctrl+D)" className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
            <Copy size={18} />
          </button>
          <button onClick={handleDeleteNode} className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors" title="Hapus (Delete)">
            <Trash2 size={18} />
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          
          <button onClick={() => setSnapToGrid(!snapToGrid)} title="Magnet Posisi (Snap to Grid)" className={`p-2 rounded-xl transition-colors ${snapToGrid ? 'bg-blue-100 text-blue-700 shadow-inner' : 'hover:bg-slate-100 text-slate-600'}`}>
            <Magnet size={18} />
          </button>
          <button onClick={() => setLineStyle(prev => prev === 'curve' ? 'straight' : 'curve')} title="Ubah Gaya Garis" className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
            <GitBranch size={18} />
          </button>
          <button onClick={handleReset} title="Mulai Ulang (Reset)" className="p-2 text-red-500 hover:text-red-600 hover:bg-slate-100 rounded-xl transition-colors">
            <RotateCcw size={18} />
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <button onClick={handleExportJSON} title="Simpan (Download JSON)" className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
            <Download size={18} />
          </button>
          
          <label title="Muat (Upload JSON)" className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer">
            <Upload size={18} />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button onClick={handleRecenter} title="Pusatkan Kamera" className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
            <Target size={18} />
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <button onClick={() => setIsFocusMode(true)} title="Mode Presentasi Layar Penuh" className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors">
            <Maximize size={18} />
          </button>
        </div>
      )}

      {message && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-3 rounded-xl shadow-md border border-red-200 flex items-center gap-3 z-30 animate-bounce">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* Panel Panduan (Sembunyikan saat Focus Mode) */}
      {!isFocusMode && (
        <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-slate-200 text-sm text-slate-600 max-w-xs z-20">
          <p className="font-semibold mb-2 text-slate-800">Pintasan Cepat:</p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-slate-400">
            <li><strong>Klik Ganda Kanvas</strong> = Topik baru</li>
            <li><strong>Tab</strong> = Tambah cabang</li>
            <li><strong>Ctrl + D</strong> = Duplikat cabang</li>
            <li><strong>Ctrl + / -</strong> = Zoom In/Out</li>
            <li><strong>Delete</strong> = Hapus cabang</li>
          </ul>
        </div>
      )}

      {/* Kontrol Zoom (Sembunyikan saat Focus Mode) */}
      {!isFocusMode && (
        <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-sm px-2 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 z-20">
          <button onClick={() => handleZoom('out')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Perkecil (Ctrl -)">
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-semibold text-slate-700 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => handleZoom('in')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Perbesar (Ctrl +)">
            <ZoomIn size={18} />
          </button>
        </div>
      )}

      {/* Area Kanvas Utama */}
      <div 
        ref={wrapperRef}
        className={`flex-1 overflow-auto relative scroll-smooth ${isFocusMode ? 'bg-white cursor-default' : ''}`}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          ref={containerRef}
          className="absolute w-[3000px] h-[3000px] origin-top-left transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            // Hilangkan background grid saat Focus Mode agar terlihat bersih seperti presentasi
            backgroundImage: isFocusMode ? 'none' : 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundColor: isFocusMode ? '#ffffff' : '#f8fafc',
            backgroundSize: '24px 24px'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onDoubleClick={handleCanvasDoubleClick}
        >
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            {visibleNodes.filter(n => n.parentId).map(node => {
              const parent = visibleNodes.find(n => n.id === node.parentId);
              return parent ? renderLine(parent, node) : null;
            })}
          </svg>

          {visibleNodes.map(node => {
            const isRoot = node.parentId === null;
            const isSelected = selectedNodeId === node.id && !isFocusMode; // Hilangkan highlight biru di Focus Mode
            const hasChildren = nodes.some(n => n.parentId === node.id);

            const customStyles: React.CSSProperties = {
              left: node.x, 
              top: node.y, 
              transform: 'translate(-50%, -50%)',
            };

            let defaultClasses = '';

            if (node.color) {
              customStyles.borderColor = isSelected ? '#2563eb' : node.color;
              customStyles.backgroundColor = `${node.color}1A`;
              if (isSelected) {
                customStyles.boxShadow = `0 10px 15px -3px ${node.color}40`;
              }
              defaultClasses = 'shadow-sm hover:shadow-md bg-white'; 
            } else {
              if (isRoot) {
                defaultClasses = isSelected
                  ? 'bg-blue-50 border-blue-500 shadow-lg'
                  : 'bg-blue-50 border-blue-300 shadow-sm hover:border-blue-400';
              } else {
                defaultClasses = isSelected
                  ? 'bg-white border-blue-500 shadow-lg'
                  : 'bg-white border-slate-200 shadow-sm hover:border-slate-300';
              }
            }

            return (
              <div
                key={node.id}
                style={customStyles}
                className={`absolute px-5 py-3 rounded-xl border-2 select-none transition-all duration-200 group ${
                  isFocusMode ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                } ${
                  isSelected ? 'z-10 scale-105' : 'z-0 hover:scale-105'
                } ${defaultClasses}`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onDoubleClick={() => {
                  if(!isFocusMode) {
                    setEditingNodeId(node.id);
                    setSelectedNodeId(node.id);
                  }
                }}
              >
                {/* Tombol Lipat Cabang (Sembunyikan di Focus Mode jika node tidak dilipat, agar lebih bersih) */}
                {hasChildren && (!isFocusMode || node.isCollapsed) && (
                  <button
                    onClick={(e) => toggleCollapse(e, node.id)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:scale-110 transition-all z-20"
                    title={node.isCollapsed ? "Buka Cabang" : "Lipat Cabang"}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {node.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}

                {/* Palet Warna */}
                {isSelected && !isFocusMode && (
                  <div 
                    className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-2 py-1.5 rounded-lg shadow-lg border border-slate-200 flex gap-1.5 animate-in fade-in zoom-in duration-200"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleColorChange('')}
                      className="w-5 h-5 rounded-full border border-slate-200 hover:scale-125 transition-transform flex items-center justify-center bg-slate-100"
                      title="Kembalikan ke Default"
                    >
                      <span className="text-[10px] text-slate-400 font-bold">✕</span>
                    </button>
                    {PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className="w-5 h-5 rounded-full border border-slate-200 hover:scale-125 transition-transform"
                        style={{ backgroundColor: color }}
                        title="Ganti Warna"
                      />
                    ))}
                  </div>
                )}

                {/* Teks / Input */}
                {editingNodeId === node.id && !isFocusMode ? (
                  <input
                    autoFocus
                    value={node.text}
                    onChange={(e) => {
                      setNodes(nodes.map(n => n.id === node.id ? { ...n, text: e.target.value } : n));
                    }}
                    onBlur={() => {
                      setEditingNodeId(null);
                      saveHistory(nodes);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingNodeId(null);
                        saveHistory(nodes);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()} 
                    className="outline-none text-center bg-transparent font-medium text-slate-800 placeholder-slate-400"
                    style={{ width: `${Math.max(node.text.length, 5)}ch` }}
                    placeholder="Ketik ide..."
                  />
                ) : (
                  <div className="font-medium text-slate-800 whitespace-nowrap">
                    {node.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}