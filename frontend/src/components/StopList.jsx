import { useState } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import StopItem from './StopItem';
import StopForm from './StopForm';

// Drag handle icon (grip dots)
function GripIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="7" cy="5" r="1.5" />
      <circle cx="13" cy="5" r="1.5" />
      <circle cx="7" cy="10" r="1.5" />
      <circle cx="13" cy="10" r="1.5" />
      <circle cx="7" cy="15" r="1.5" />
      <circle cx="13" cy="15" r="1.5" />
    </svg>
  );
}

// Sortable wrapper for each stop item
function SortableStopItem({ stop, index, editingStopId, onEdit, onDelete, onSave, onCancelEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-start gap-2 ${isDragging ? 'bg-blue-50 rounded-lg' : ''}`}>
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-3 p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
        style={{ touchAction: 'none' }}
      >
        <GripIcon />
      </button>

      <div className="flex-1 min-w-0">
        <StopItem
          stop={stop}
          index={index}
          isEditing={editingStopId === stop.id}
          onEdit={onEdit}
          onDelete={onDelete}
          onSave={onSave}
          onCancelEdit={onCancelEdit}
        />
      </div>
    </div>
  );
}

export default function StopList({ stops, onAddStop, onEditStop, onDeleteStop, onReorderStops }) {
  const [editingStopId, setEditingStopId] = useState(null);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 0, tolerance: 5 },
    })
  );

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIndex = stops.findIndex((s) => s.id === active.id);
      const newIndex = stops.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(stops, oldIndex, newIndex);
      onReorderStops(reordered.map((s) => s.id));
    }
  }

  async function handleSaveEdit(updates) {
    await onEditStop(editingStopId, updates);
    setEditingStopId(null);
  }

  async function handleAddStop(data) {
    await onAddStop(data);
    setIsAddingStop(false);
  }

  const activeStop = stops.find((s) => s.id === activeId);

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4 px-4">
        Stops ({stops.length})
      </h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 px-4">
            {stops.map((stop, index) => (
              <SortableStopItem
                key={stop.id}
                stop={stop}
                index={index}
                editingStopId={editingStopId}
                onEdit={(s) => setEditingStopId(s.id)}
                onDelete={onDeleteStop}
                onSave={handleSaveEdit}
                onCancelEdit={() => setEditingStopId(null)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay (shows ghost while dragging) */}
        <DragOverlay>
          {activeStop ? (
            <div className="bg-white shadow-xl rounded-lg p-4 opacity-90 border border-blue-200">
              <p className="text-sm font-semibold text-slate-800">{activeStop.address}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add stop inline form */}
      {isAddingStop ? (
        <div className="px-4 mt-4">
          <StopForm onSubmit={handleAddStop} onCancel={() => setIsAddingStop(false)} />
        </div>
      ) : (
        <div className="px-4 mt-4">
          <button
            onClick={() => setIsAddingStop(true)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            + Add Stop
          </button>
        </div>
      )}
    </div>
  );
}
