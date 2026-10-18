'use client';

import { useState } from 'react';

const SOMETHING_ELSE = '__something_else__';

/** "zari border" reads as "Zari border" in a list. The stored value keeps the
 *  shop's lower-case wording, which public pages capitalise on their own. */
const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Pick from the shop's own words, or type one it doesn't have.
 *
 * A list rather than a text box, because these are the fields the photo reader
 * most often gets slightly wrong, and correcting one should be a tap rather
 * than typing on a phone at the rack. The vocabulary is the same one the
 * reader chooses from, so the right answer is nearly always in it.
 *
 * Nearly is not always — "kuttu border" or "kora" are real and not listed — so
 * "Something else…" swaps the list for a box. A value already outside the list
 * (typed earlier, or from an older entry) is shown as its own option rather
 * than silently replaced by the first item, which is what a <select> does with
 * a value it doesn't recognise.
 */
export default function ChoiceField({
  value,
  options,
  onChange,
  flagged,
  id,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  flagged?: boolean;
  id?: string;
}) {
  const [typing, setTyping] = useState(false);
  const flagClass = flagged ? 'field-flagged' : '';

  if (typing) {
    return (
      <div>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          placeholder="Type it in"
          className={`field ${flagClass}`}
        />
        <button
          type="button"
          onClick={() => setTyping(false)}
          className="text-sm text-maroon-700 font-medium mt-1.5 py-1"
        >
          ← Choose from the list
        </button>
      </div>
    );
  }

  const custom = value !== '' && !options.includes(value);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => {
        if (e.target.value === SOMETHING_ELSE) {
          setTyping(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }}
      className={`field ${flagClass}`}
    >
      {value === '' && <option value="">Choose…</option>}
      {custom && <option value={value}>{label(value)}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {label(o)}
        </option>
      ))}
      <option value={SOMETHING_ELSE}>Something else…</option>
    </select>
  );
}
