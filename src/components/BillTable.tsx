'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  type BillItem,
  blankItem,
  cellValue,
  columnLabel,
  withCellValue,
} from '@/lib/bills';

/**
 * A bill as a table, with every cell correctable.
 *
 * Shown as a real table because that is how it can be checked: laid out like
 * the paper it came from, so the eye can run down both together. But a table
 * wide enough to match a bill has cells too small to tap accurately, so
 * editing happens in a sheet — tap a row, correct it in proper inputs, done.
 * Reading and editing want different shapes and get them.
 */
export default function BillTable({
  columns,
  items,
  onChange,
  flagged,
}: {
  /** Standard and extra column keys, in the order this bill shows them. */
  columns: string[];
  items: BillItem[];
  onChange: (items: BillItem[]) => void;
  /** Cells the reader was unsure of, as "row 2 rate" style strings. */
  flagged?: string[];
}) {
  const [editing, setEditing] = useState<number | null>(null);

  function updateRow(index: number, item: BillItem) {
    onChange(items.map((row, i) => (i === index ? item : row)));
  }

  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index));
    setEditing(null);
  }

  if (columns.length === 0) {
    return (
      <p className="text-sm text-ink-soft py-4">
        No columns were read from this bill. Add a row to start one by hand.
      </p>
    );
  }

  return (
    <>
      <div className="-mx-5 overflow-x-auto [scrollbar-width:thin]">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="border-y border-line bg-canvas-warm">
              {columns.map((c) => (
                <th
                  key={c}
                  className="text-left font-medium text-ink-soft whitespace-nowrap px-3 py-2.5 first:pl-5 last:pr-5"
                >
                  {columnLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={i}
                onClick={() => setEditing(i)}
                className="border-b border-line cursor-pointer hover:bg-canvas-warm/60 transition-colors"
              >
                {columns.map((c) => {
                  const value = cellValue(item, c);
                  return (
                    <td
                      key={c}
                      className={`px-3 py-2.5 first:pl-5 last:pr-5 align-top ${
                        c === 'description'
                          ? 'text-ink min-w-[10rem]'
                          : 'text-ink-soft whitespace-nowrap tabular-nums'
                      }`}
                    >
                      {value || <span className="text-ink-faint">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => {
          onChange([...items, blankItem()]);
          setEditing(items.length);
        }}
        className="btn btn-secondary w-full mt-3 text-sm"
      >
        <Plus size={15} />
        Add a row
      </button>

      {editing !== null && items[editing] && (
        <RowSheet
          columns={columns}
          item={items[editing]}
          index={editing}
          flagged={flagged ?? []}
          onSave={(item) => {
            updateRow(editing, item);
            setEditing(null);
          }}
          onDelete={() => removeRow(editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function RowSheet({
  columns,
  item,
  index,
  flagged,
  onSave,
  onDelete,
  onClose,
}: {
  columns: string[];
  item: BillItem;
  index: number;
  flagged: string[];
  onSave: (item: BillItem) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(item);

  // "row 2 rate" — the reader names cells that way, so match loosely rather
  // than demanding an exact phrasing from a model that is only ever guessing
  // at how to describe a cell.
  function isFlagged(column: string): boolean {
    const row = String(index + 1);
    return flagged.some((f) => {
      const t = f.toLowerCase();
      return t.includes(column.toLowerCase()) && (t.includes(row) || !/\d/.test(t));
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-auto bg-surface rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="eyebrow mb-1">Row {index + 1}</p>
            <h2 className="font-display text-xl text-maroon-900 leading-tight">
              Check this line
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost !min-h-0 p-2 -m-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {columns.map((c) => {
          const uncertain = isFlagged(c);
          return (
            <div key={c} className="mb-4">
              <label className="block text-sm font-medium text-ink mb-1.5">
                {columnLabel(c)}
                {uncertain && <span className="text-gold-700"> ⚠</span>}
              </label>
              <input
                value={cellValue(draft, c)}
                onChange={(e) => setDraft(withCellValue(draft, c, e.target.value))}
                inputMode={
                  c === 'description' || c === 'unit' ? 'text' : 'decimal'
                }
                className={`field ${uncertain ? 'field-flagged' : ''}`}
              />
              {uncertain && (
                <p className="text-xs text-warn mt-1.5">
                  Hard to read on the photo — please confirm
                </p>
              )}
            </div>
          );
        })}

        <button onClick={() => onSave(draft)} className="btn btn-primary w-full mt-2">
          Done
        </button>
        <button
          onClick={onDelete}
          className="btn w-full mt-2 border border-bad/25 text-bad text-sm hover:bg-bad-bg"
        >
          <Trash2 size={15} />
          Remove this row
        </button>
      </div>
    </div>
  );
}
