import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MousePointer2 } from 'lucide-react';

export default function App() {
  // State untuk menyimpan daftar node (ide/cabang)
  const [nodes, setNodes] = useState([
    { id: 'root', text: 'Ide Utama', x: 1500, y: 1500, parentId: null }
  ]);
  
  // State interaksi
  const [selectedNodeId, setSelectedNodeId] = useState('root');
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [moveStep, setMoveStep] = useState(50); // Jarak pergeseran manual
  
  const [message, setMessage] = useState('');

  // Referensi untuk area canvas
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
    const root = nodes.find(n => n.id === 'root');
    focusOnNode(root);
  }, []);

  // Fungsi Gerak Manual
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

          // Batasan kanvas
          newX = Math.max(50, Math.min(2950, newX));
          newY = Math.max(50, Math.min(2950, newY));

          const updatedNode = { ...n, x: newX, y: newY };
          // Fokuskan kamera ke node yang sedang digeser
          focusOnNode(updatedNode);
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
    if (e.target === e.currentTarget || e.target.id === 'canvas-grid') {
      setSelectedNodeId(null);
      setEditingNodeId(null);
    }
  };

  const handleAddChild = () => {
    if (!selectedNodeId) {
      setMessage('Pilih node terlebih dahulu.');
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
    focusOnNode(newNode);
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId || selectedNodeId === 'root') {
      setMessage(selectedNodeId === 'root' ? 'Node utama tidak bisa dihapus.' : 'Pilih node.');
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
      
      {/* Toolbar Atas */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2 z-30 w-[90%] max-w-md justify-around">
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

      {/* Pesan Error/Info */}
      {message && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold z-30 animate-pulse">
          {message}
        </div>
      )}

      {/* Kontrol Gerak Manual (D-Pad) */}
      {selectedNodeId && (
        <div className="absolute bottom-6 right-6 z-40 flex flex-col items-center gap-2">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center gap-2">
            <button onClick={() => moveNodeManual('up')} className="p-3 bg-slate-100 rounded-full active:bg-blue-500 active:text-white shadow-sm">
              <ChevronUp size={24} />
            </button>
            <div className="flex gap-4">
              <button onClick={() => moveNodeManual('left')} className="p-3 bg-slate-100 rounded-full active:bg-blue-500 active:text-white shadow-sm">
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => moveNodeManual('right')} className="p-3 bg-slate-100 rounded-full active:bg-blue-500 active:text-white shadow-sm">
                <ChevronRight size={24} />
              </button>
            </div>
            <button onClick={() => moveNodeManual('down')} className="p-3 bg-slate-100 rounded-full active:bg-blue-500 active:text-white shadow-sm">
              <ChevronDown size={24} />
            </button>
          </div>
          
          {/* Switch Jarak Gerak */}
          <div className="flex bg-white rounded-full p-1 shadow-md border border-slate-200 overflow-hidden">
            <button 
              onClick={() => setMoveStep(20)} 
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${moveStep === 20 ? 'bg-blue-500 text-white' : 'text-slate-400'}`}
            >
              HALUS
            </button>
            <button 
              onClick={() => setMoveStep(100)} 
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${moveStep === 100 ? 'bg-blue-500 text-white' : 'text-slate-400'}`}
            >
              JAUH
            </button>
          </div>
        </div>
      )}

      {/* Area Canvas */}
      <div 
        ref={wrapperRef}
        className="flex-1 overflow-auto relative touch-none bg-slate-50"
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
      
      {/* Instruksi Singkat */}
      {!selectedNodeId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/80 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none">
          Ketuk Node Untuk Memindahkan
        </div>
      )}
    </div>
  );
}
