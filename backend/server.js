import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY, PORT = 3000 } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Falta SUPABASE_URL o SUPABASE_ANON_KEY en el archivo .env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Endpoint público -> tabla real en Supabase
const TABLES = { inventory: 'tib_inventory', references: 'tib_references', categories: 'tib_categories' };
// Campos permitidos por tabla (evita guardar datos inesperados)
const FIELDS = { inventory: ['id', 'ref', 'qty', 'img', 'category', 'subcategory', 'size'],
  references: ['id', 'ref', 'note', 'img', 'category', 'subcategory'],
  categories: ['id', 'name', 'parent'] };
// Campos básicos (por si aún no se ejecutó update.sql)
const BASE = { inventory: ['id', 'ref', 'qty', 'img'], references: ['id', 'ref', 'note', 'img'] };
const friendly = e => /does not exist|schema cache/i.test(e.message)
  ? 'Falta ejecutar el SQL en Supabase (' + e.message + ')' : e.message;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===== Registro de movimientos (ingresos / salidas) =====
// La lógica de stock + registro corre en Supabase dentro de una función SQL (atómica).
const bizError = e => e.code === 'P0001' ? 400 : 500;

app.get('/api/movements', async (req, res) => {
  const { data, error } = await supabase.from('tib_movements').select('*')
    .order('created_at', { ascending: false }).limit(2000);
  if (error) return res.status(500).json({ error: friendly(error) });
  res.json(data);
});

// Registra un ingreso ('in') o salida ('out') y actualiza el stock
app.post('/api/movements', async (req, res) => {
  const { item_id, type, reason } = req.body || {};
  const qty = Number(req.body?.qty);
  if (!item_id) return res.status(400).json({ error: 'Falta el artículo' });
  if (!['in', 'out'].includes(type)) return res.status(400).json({ error: 'Tipo de movimiento inválido' });
  if (!Number.isInteger(qty) || qty < 1 || qty > 1000000) return res.status(400).json({ error: 'La cantidad debe ser un entero mayor a 0' });
  const { data, error } = await supabase.rpc('tib_apply_movement', {
    p_id: randomUUID(), p_item: String(item_id), p_type: type, p_qty: qty,
    p_reason: String(reason || '').trim().slice(0, 120)
  });
  if (error) return res.status(bizError(error)).json({ error: friendly(error) });
  res.json(data);
});

// Anula un movimiento: revierte su efecto en el stock y lo marca como anulado
app.post('/api/movements/:id/void', async (req, res) => {
  const { data, error } = await supabase.rpc('tib_void_movement', { p_id: String(req.params.id) });
  if (error) return res.status(bizError(error)).json({ error: friendly(error) });
  res.json(data);
});

const guard = (req, res, next) => {
  if (!TABLES[req.params.t]) return res.status(404).json({ error: 'Recurso no encontrado' });
  next();
};

app.get('/api/:t', guard, async (req, res) => {
  const { data, error } = await supabase.from(TABLES[req.params.t]).select('*').order('created_at', { ascending: false });
  if (error) {
    if (req.params.t === 'categories') return res.json([]);
    return res.status(500).json({ error: friendly(error) });
  }
  res.json(data);
});

app.post('/api/:t', guard, async (req, res) => {
  const t = req.params.t;
  const row = Object.fromEntries(FIELDS[t].filter(k => k in req.body).map(k => [k, req.body[k]]));
  if (!row.id || !String(row.ref ?? row.name ?? '').trim()) return res.status(400).json({ error: 'Datos incompletos' });
  if (t === 'inventory') row.qty = Math.max(0, parseInt(row.qty) || 0);
  let { error } = await supabase.from(TABLES[t]).upsert(row);
  if (error && BASE[t] && /column|schema cache/i.test(error.message)) {
    const basic = Object.fromEntries(BASE[t].filter(k => k in row).map(k => [k, row[k]]));
    ({ error } = await supabase.from(TABLES[t]).upsert(basic));
    if (!error) return res.json({ ok: true, warning: 'Guardado sin categoría: ejecuta update.sql en Supabase' });
  }
  if (error) return res.status(500).json({ error: friendly(error) });
  res.json({ ok: true });
});

app.delete('/api/:t', guard, async (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: 'Sin ids' });
  const { error } = await supabase.from(TABLES[req.params.t]).delete().in('id', ids);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Sirve el frontend
const front = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend');
app.use(express.static(front));

app.listen(PORT, () => console.log(`Tester Invetary B -> http://localhost:${PORT}`));
