const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// --- Esquemas de la Base de Datos ---

// Esquema para los equipos de un cliente
const equipmentSchema = new mongoose.Schema({
  lavadoras: { type: Number, default: 0 },
  cocinas: { type: Number, default: 0 },
  refri: { type: Number, default: 0 },
  ac: { type: Number, default: 0 }
}, {_id: false});

// Esquema para los Contactos/Clientes
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' }, // Campo añadido
  address: { type: String, default: '' },
  type: { type: String, enum: ['personal', 'juridico'], required: true },
  equipment: equipmentSchema
});
const Contact = mongoose.model('Contact', contactSchema);

// Esquema para las Tareas/Citas
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  // Sistema de recordatorios mejorado
  reminder: {
    value: { type: Number, default: 10 },
    unit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'minutes' }
  },
  contactId: { type: String },
  status: { type: String, enum: ['pendiente', 'completado'], default: 'pendiente' },
  completedDate: { type: Date }
});
const Task = mongoose.model('Task', taskSchema);


// --- Rutas de la API ---

// Contactos
app.get('/api/contacts', async (req, res) => { try { const contacts = await Contact.find(); res.json(contacts); } catch (err) { res.status(500).json({ message: err.message }); } });
app.post('/api/contacts', async (req, res) => { const contact = new Contact(req.body); try { const newContact = await contact.save(); res.status(201).json(newContact); } catch (err) { res.status(400).json({ message: err.message }); } });
app.put('/api/contacts/:id', async (req, res) => { try { const updatedContact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updatedContact); } catch (err) { res.status(400).json({ message: err.message }); } });
app.delete('/api/contacts/:id', async (req, res) => { try { await Contact.findByIdAndDelete(req.params.id); res.json({ message: 'Contacto eliminado' }); } catch (err) { res.status(500).json({ message: err.message }); } });

// Tareas
app.get('/api/tasks', async (req, res) => { try { const tasks = await Task.find(); res.json(tasks); } catch (err) { res.status(500).json({ message: err.message }); } });
app.post('/api/tasks', async (req, res) => { const task = new Task(req.body); try { const newTask = await task.save(); res.status(201).json(newTask); } catch (err) { res.status(400).json({ message: err.message }); } });
app.patch('/api/tasks/:id/complete', async (req, res) => { try { const updatedTask = await Task.findByIdAndUpdate( req.params.id, { status: 'completado', completedDate: new Date() }, { new: true } ); res.json(updatedTask); } catch (err) { res.status(400).json({ message: err.message }); } });
app.put('/api/tasks/:id', async (req, res) => { try { const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updatedTask); } catch (err) { res.status(400).json({ message: err.message }); } });
app.delete('/api/tasks/:id', async (req, res) => { try { await Task.findByIdAndDelete(req.params.id); res.json({ message: 'Tarea eliminada permanentemente' }); } catch (err) { res.status(500).json({ message: err.message }); } });

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
