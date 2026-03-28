import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export default function App() {
  // State untuk menyimpan daftar node (ide/cabang)
  const [nodes, setNodes] = useState([
    { id: 'root', text: 'Ide Utama', x: 1500, y: 1500, parentId: null }
  ]);
  
  // State interaksi
  const [selectedNodeId, setSelectedNodeId] = useState('root');
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [isHolding, setIsHolding] = useState(false); // State baru untuk tanda sedang ditahan
  
  // Ref untuk timer long press
  const holdTimerRef = useRef(null);
  const LONG_PRESS_DURATION = 400; // Durasi hold dalam milidetik

  // Offset untuk memastikan drag & drop mulus
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState('');

  // Referensi untuk area canvas
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Pusatkan scroll ke node utama saat pertama kali dimuat
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollLeft = 1500 - window.innerWidth / 2;
      wrapperRef.current.scrollTop = 1500 - window.innerHeight / 2;
    }
  }, []);

  // Fungsi untuk memulai timer deteksi "Hold"
  const initiateHold = (clientX, clientY, id) => {
    const node = nodes.find(n => n.id === id);
    if (!node || !containerRef.current) return;

    setSelectedNodeId(id);
    
    // Bersihkan timer sebelumnya jika ada
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    // Set timer baru
    holdTimerRef.current = setTimeout(() => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      setDragOffset({ x: x - node.x, y: y - node.y });
      setDraggingNodeId(id);
      setIsHolding(true); // Memberikan feedback visual

      // Berikan getaran halus jika di dukung perangkat (Android)
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setDraggingNodeId(null);
    setIsHolding(false);
  };

  // Handler Mouse
  const handleNodeMouseDown = (e, id) => {
    e.stopPropagation();
    initiateHold(e.clientX, e.clientY, id);
  };

  // Handler Touch (Android/iOS)
  const handleNodeTouchStart = (e, id) => {
    const touch = e.touches[0];
    initiateHold(touch.clientX, touch.clientY, id);
  };

  const handleCanvasMouseDown = () => {
    setSelectedNodeId(null);
    setEditingNodeId(null);
    setMessage('');
  };

  // Logika pergerakan (Mouse & Touch)
  const moveDragging = (clientX, clientY) => {
    if (!draggingNodeId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const newX = Math.max(50, Math.min(2950, mouseX - dragOffset.x));
    const newY = Math.max(50, Math.min(2950, mouseY - dragOffset.y));

    setNodes(nodes.map(n => 
      n.id === draggingNodeId 
        ? { ...n, x: newX, y: newY } 
        : n
    ));
  };

  const handleMouseMove = (e) => moveDragging(e.clientX, e.clientY);
  
  const handleTouchMove = (e) => {
    if (draggingNodeId) {
      // Mencegah layar bergeser/scroll saat kita sedang drag node
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      moveDragging(touch.clientX, touch.clientY);
    } else {
      // Jika user bergerak sebelum timer selesai, batalkan hold
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }
  };

  const handleAddChild = () => {
    if (!selectedNodeId) {
      setMessage('Pilih node terlebih dahulu untuk menambahkan cabang.');
      return;
    }
    const parent = nodes.find(n => n.id === selectedNodeId);
    const newNode = {
      id: Date.now().toString(),
      text: 'Ide Baru',
      x: parent.x + 200,
      y: parent.y + (Math.random() * 100 - 50),
      parentId: parent.id
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
    setMessage('');
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    if (selectedNodeId === 'root') {
      setMessage('Node utama tidak dapat dihapus.');
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
    setMessage('');
  };

  const renderLine = (parent, child) => {
    const dx = child.x - parent.x;
    const controlPointX1 = parent.x + dx * 0.5;
    const controlPointY1 = parent.y;
    const controlPointX2 = child.x - dx * 0.5;
    const controlPointY2 = child.y;

    const path = `M ${parent.x} ${parent.y} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${child.x} ${child.y}`;

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
    <div className="flex flex-col w-full h-screen bg-slate-100 font-sans overflow-hidden">
      
      {/* Toolbar Atas */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-2 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2 z-20">
        <button 
          onClick={handleAddChild} 
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors text-sm font-semibold text-slate-700"
        >
          <Plus size={18} /> Tambah Cabang
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <button 
          onClick={handleDeleteNode} 
          className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors text-sm font-semibold"
        >
          <Trash2 size={18} /> Hapus
        </button>
      </div>

      {message && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-3 rounded-xl shadow-md border border-red-200 flex items-center gap-3 z-20 animate-bounce">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* Area Canvas */}
      <div 
        ref={wrapperRef}
        className="flex-1 overflow-auto relative scroll-smooth"
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchEnd={cancelHold}
      >
        <div 
          ref={containerRef}
          className="absolute w-[3000px] h-[3000px] bg-slate-50"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            {nodes.filter(n => n.parentId).map(node => {
              const parent = nodes.find(n => n.id === node.parentId);
              return parent ? renderLine(parent, node) : null;
            })}
          </svg>

          {nodes.map(node => {
            const isDraggingThis = draggingNodeId === node.id;
            return (
              <div
                key={node.id}
                style={{ 
                  left: node.x, 
                  top: node.y, 
                  transform: `translate(-50%, -50%) ${isDraggingThis ? 'scale(1.1)' : 'scale(1)'}`,
                  touchAction: 'none'
                }}
                className={`absolute px-5 py-3 rounded-xl border-2 select-none transition-all duration-150 ${
                  selectedNodeId === node.id 
                    ? 'border-blue-500 shadow-lg z-10' 
                    : 'border-slate-200 shadow-sm hover:border-slate-300 z-0'
                } ${
                  node.id === 'root' 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white'
                } ${
                  isDraggingThis ? 'cursor-grabbing opacity-80' : 'cursor-grab'
                }`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onTouchStart={(e) => handleNodeTouchStart(e, node.id)}
                onDoubleClick={() => {
                  setEditingNodeId(node.id);
                  setSelectedNodeId(node.id);
                }}
              >
                {editingNodeId === node.id ? (
                  <input
                    autoFocus
                    value={node.text}
                    onChange={(e) => {
                      setNodes(nodes.map(n => n.id === node.id ? { ...n, text: e.target.value } : n));
                    }}
                    onBlur={() => setEditingNodeId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingNodeId(null);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
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
