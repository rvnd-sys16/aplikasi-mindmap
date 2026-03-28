import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MousePointer2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export default function App() {
  const [nodes, setNodes] = useState([
    { id: 'root', text: 'Ide Utama', x: 1500, y: 1500, parentId: null }
  ]);
  
  const [selectedNodeId, setSelectedNodeId] = useState('root');
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [moveStep, setMoveStep] = useState(40); // Jarak geser default
  const [message, setMessage] = useState('');

  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Pusatkan scroll ke node aktif
  const focusOnNode = (node) => {
    if (wrapperRef.current && node) {
      wrapperRef.current.scrollTo({
        left: node.x - window.innerWidth / 2,
        top: node.y - window.innerHeight / 2,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Fokus ke Ide Utama saat pertama kali dibuka
    setTimeout(() => {
      const root = nodes.find(n => n.id === 'root');
      focusOnNode(root);
    }, 100);
  }, []);

  // Fungsi Gerak Manual menggunakan Panah
  const moveNodeManual = (direction) => {
    if (!selectedNodeId) return;

    setNodes(prevNodes => {
      const newNodes = prevNodes.map(n => {
        if (n.id === selectedNodeId) {
          let newX = n.x;
          let newY = n.y;

          if (direction === 'up') newY -= moveStep;
          if (direction === 'down') newY += moveStep;
          if (direction === 'left') newX -= moveStep;
          if (direction === 'right') newX += moveStep;

          // Batas agar node tidak keluar dari kanvas
          newX = Math.max(50, Math.min(2950, newX));
          newY = Math.max(50, Math.min(2950, newY));

          const updatedNode = { ...n, x: newX, y: newY };
          focusOnNode(updatedNode); // Kamera otomatis mengikuti node
          return updatedNode;
        }
        return n;
      });
      return newNodes;
    });
  };

  const handleNodeClick = (id) => {
    setSelectedNodeId(id);
    setEditingNodeId(null);
    setMessage('');
  };

  const handleCanvasClick = (e) => {
    if (e.target.id === 'canvas-grid' || e.target === e.currentTarget) {
      setSelectedNodeId(null);
      setEditingNodeId(null);
    }
  };

  const handleAddChild = () => {
    if (!selectedNodeId) {
      setMessage('Pilih node terlebih dahulu.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const parent = nodes.find(n => n.id === selectedNodeId);
    const newNode = {
      id: Date.now().toString(),
      text: 'Ide Baru',
      x: parent.x + 150,
      y: parent.y + (Math.random() * 100 - 50),
      parentId: parent.id
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
    setMessage('');
    setTimeout(() => focusOnNode(newNode), 50);
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId || selectedNodeId === 'root') {
      setMessage(selectedNodeId === 'root' ? 'Node utama tidak bisa dihapus.' : 'Pilih node.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    const getDescendants = (id, allNodes) => {
      const children = allNodes.filter(n => n.parentId === id);
      let descendants = [...children];
      children.forEach(c => {
        descendants = [...descendants, ...getDescendants(c.id, allNodes)];
      });
      return descendants;
    };
    
    const toDelete = [selectedNodeId, ...getDescendants(selectedNodeId, nodes).map(n => n.id)];
    setNodes(nodes.filter(n => !toDelete.includes(n.id)));
    setSelectedNodeId(null);
  };

  // Render garis lengkung antar node
  const renderLine = (parent, child) => {
    const dx = child.x - parent.x;
    const path = `M ${parent.x} ${parent.y} C ${parent.x + dx * 0.5} ${parent.y}, ${child.x - dx * 0.5} ${child.y}, ${child.x} ${child.y}`;

    return (
      <path 
        key={`line-${child.id}`}
        d={path}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="3"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className="flex flex-col w-full h-screen bg-slate-100 font-sans overflow-hidden relative">
      
      {/* KELOMPOK TOOLBAR UTAMA & PANAH */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 w-[92%] max-w-md">
        
        {/* Toolbar Baris 1: Tambah, Hapus, Fokus */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-around w-full">
          <button onClick={handleAddChild} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <Plus size={20} className="text-blue-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Tambah</span>
          </button>
          <div className="w-px h-8 bg-slate-200"></div>
          <button onClick={handleDeleteNode} className="flex flex-col items-center gap-1 p-2 hover:bg-red-50 rounded-xl transition-colors">
            <Trash2 size={20} className="text-red-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Hapus</span>
          </button>
          <div className="w-px h-8 bg-slate-200"></div>
          <button onClick={() => focusOnNode(nodes.find(n => n.id === selectedNodeId) || nodes[0])} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <MousePointer2 size={20} className="text-slate-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Fokus</span>
          </button>
        </div>

        {/* Toolbar Baris 2: D-Pad Panah (Hanya muncul jika ada node yang dipilih) */}
        {selectedNodeId && (
          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-between w-full animate-in fade-in slide-in-from-top-2">
            
            {/* Tombol Pengatur Jarak (Halus / Jauh) */}
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jarak Geser</span>
              <button 
                onClick={() => setMoveStep(moveStep === 40 ? 100 : 40)}
                className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors w-max"
              >
                {moveStep === 40 ? 'HALUS (40px)' : 'JAUH (100px)'}
              </button>
            </div>

            {/* Kumpulan Panah */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
              <button onClick={() => moveNodeManual('left')} className="p-2 bg-white hover:bg-blue-50 rounded-lg shadow-sm text-slate-700 active:bg-blue-500 active:text-white transition-all">
                <ArrowLeft size={18} />
              </button>
              <button onClick={() => moveNodeManual('up')} className="p-2 bg-white hover:bg-blue-50 rounded-lg shadow-sm text-slate-700 active:bg-blue-500 active:text-white transition-all">
                <ArrowUp size={18} />
              </button>
              <button onClick={() => moveNodeManual('down')} className="p-2 bg-white hover:bg-blue-50 rounded-lg shadow-sm text-slate-700 active:bg-blue-500 active:text-white transition-all">
                <ArrowDown size={18} />
              </button>
              <button onClick={() => moveNodeManual('right')} className="p-2 bg-white hover:bg-blue-50 rounded-lg shadow-sm text-slate-700 active:bg-blue-500 active:text-white transition-all">
                <ArrowRight size={18} />
              </button>
            </div>
            
          </div>
        )}
      </div>

      {/* Pesan Alert */}
      {message && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold z-50 animate-bounce">
          {message}
        </div>
      )}

      {/* Area Canvas Utama */}
      <div 
        ref={wrapperRef}
        className="flex-1 overflow-auto relative bg-slate-50"
        onClick={handleCanvasClick}
      >
        <div 
          ref={containerRef}
          id="canvas-grid"
          className="absolute w-[3000px] h-[3000px]"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundSize: '30px 30px'
          }}
        >
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {nodes.filter(n => n.parentId).map(node => {
              const parent = nodes.find(n => n.id === node.parentId);
              return parent ? renderLine(parent, node) : null;
            })}
          </svg>

          {nodes.map(node => (
            <div
              key={node.id}
              style={{ 
                left: node.x, 
                top: node.y, 
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute px-6 py-4 rounded-2xl border-2 select-none transition-all duration-300 min-w-[100px] text-center ${
                selectedNodeId === node.id 
                  ? 'border-blue-500 bg-blue-50 shadow-2xl scale-110 z-20' 
                  : 'border-slate-200 bg-white shadow-md z-10'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingNodeId(node.id);
              }}
            >
              {editingNodeId === node.id ? (
                <input
                  autoFocus
                  className="bg-transparent border-b-2 border-blue-400 outline-none text-center font-bold text-slate-800 w-full"
                  value={node.text}
                  onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, text: e.target.value } : n))}
                  onBlur={() => setEditingNodeId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingNodeId(null)}
                />
              ) : (
                <div className="font-bold text-slate-700 leading-tight">
                  {node.text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Teks Instruksi di Bawah Layar */}
      {!selectedNodeId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/80 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none z-50">
          Ketuk Node Untuk Menggeser
        </div>
      )}
    </div>
  );
}
