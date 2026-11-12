"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

/**
 * 드래그로 순서 바꾸기 (A-09). 손잡이를 마우스로 끌거나, 포커스 후 Space → 방향키 → Space 로도 옮길 수 있다.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  label,
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
  label: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Space 키로 집고, 방향키로 옮긴 뒤, Space 키로 내려놓습니다. Esc 로 취소합니다.",
        },
      }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2" aria-label={label}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label="순서 바꾸기 손잡이"
      className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-subtle hover:bg-line/60 hover:text-fg active:cursor-grabbing"
    >
      <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden fill="currentColor">
        <circle cx="2" cy="2" r="1.5" />
        <circle cx="8" cy="2" r="1.5" />
        <circle cx="2" cy="8" r="1.5" />
        <circle cx="8" cy="8" r="1.5" />
        <circle cx="2" cy="14" r="1.5" />
        <circle cx="8" cy="14" r="1.5" />
      </svg>
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80 shadow-lg" : undefined}
    >
      {children(handle)}
    </li>
  );
}
