import React, { useState, useEffect, useCallback } from 'react';

// --- Estilos Globales (sin cambios) ---
const GlobalStyles = () => ( <style>{` :root { --primary-color: #2a68c7; --secondary-color: #f4f7fe; --font-color: #34495e; --light-font-color: #6a738c; --border-color: #e0e5f5; --white-color: #ffffff; --danger-color: #e74c3c; --success-color: #2ecc71; } body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: var(--secondary-color); color: var(--font-color); } * { box-sizing: border-box; } button { cursor: pointer; border: none; font-family: inherit; transition: background-color 0.2s ease; } input, textarea, select { font-family: inherit; width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 15px; font-size: 16px; } h1, h2, h3, p { margin: 0; } `}</style> );

// --- Componentes de Íconos (SVG) (sin cambios) ---
const PlusIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg> );
const TrashIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M3 6H5H21" stroke="var(--danger-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="var(--danger-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg> );
const CheckIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg> );

// --- Componente Principal App ---
const App = () => {
  const [currentView, setCurrentView] = useState('agenda');
  const [tasks, setTasks] = useState([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [contactFilter, setContactFilter] = useState('todos');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // CAMBIO: Estado para el recordatorio
  const [reminder, setReminder] = useState(null);
  const [triggeredReminders, setTriggeredReminders] = useState(new Set());
  
  const API_URL = 'https://stc-app.onrender.com/api';

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, contactsRes] = await Promise.all([
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/contacts`)
      ]);
      const tasksData = await tasksRes.json();
      const contactsData = await contactsRes.json();
      if (Array.isArray(tasksData)) setTasks(tasksData);
      if (Array.isArray(contactsData)) setContacts(contactsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CAMBIO: Lógica para verificar recordatorios
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status === 'pendiente' && task.reminderMinutes > 0 && !triggeredReminders.has(task._id)) {
          const taskDateTime = new Date(`${task.date}T${task.time}`);
          const reminderTime = new Date(taskDateTime.getTime() - task.reminderMinutes * 60000);
          if (now >= reminderTime && now < taskDateTime) {
            const contact = contacts.find(c => c._id === task.contactId);
            setReminder({ ...task, contactName: contact?.name });
            setTriggeredReminders(prev => new Set(prev).add(task._id));
          }
        }
      });
    };
    const interval = setInterval(checkReminders, 30000); // Revisa cada 30 segundos
    return () => clearInterval(interval);
  }, [tasks, contacts, triggeredReminders]);


  const getWeekDays = (date) => { const startDate = new Date(date); const day = startDate.getDay(); const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); startDate.setDate(diff); return Array.from({ length: 7 }, (_, i) => { const d = new Date(startDate); d.setDate(startDate.getDate() + i); return d; }); };
  const weekDays = getWeekDays(currentDate);
  const changeWeek = (dir) => { const newDate = new Date(currentDate); newDate.setDate(newDate.getDate() + (dir * 7)); setCurrentDate(newDate); };
  
  // --- Lógica para Tareas (con API) ---
  const handleSaveTask = async (taskData) => { if (taskData._id) { const res = await fetch(`${API_URL}/tasks/${taskData._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskData) }); const updatedTask = await res.json(); setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t)); } else { const res = await fetch(`${API_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskData) }); const newTask = await res.json(); setTasks([...tasks, newTask]); } closeTaskModal(); };
  const handleCompleteTask = async (id) => { const res = await fetch(`${API_URL}/tasks/${id}/complete`, { method: 'PATCH' }); const updatedTask = await res.json(); setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t)); closeTaskModal(); };
  const handleDeleteTask = async (id) => { if (window.confirm("¿Seguro que quieres ELIMINAR PERMANENTEMENTE esta tarea?")) { await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' }); setTasks(tasks.filter(t => t._id !== id)); closeTaskModal(); } };
  const openTaskModal = (task = null) => { setCurrentTask(task); setTaskModalVisible(true); };
  const closeTaskModal = () => { setCurrentTask(null); setTaskModalVisible(false); };
  
  // --- Lógica para Contactos (con API) ---
  const handleSaveContact = async (contactData) => { if (contactData._id) { const res = await fetch(`${API_URL}/contacts/${contactData._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactData) }); const updatedContact = await res.json(); setContacts(contacts.map(c => c._id === updatedContact._id ? updatedContact : c)); } else { const res = await fetch(`${API_URL}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactData) }); const newContact = await res.json(); setContacts([...contacts, newContact]); } closeContactModal(); };
  const handleDeleteContact = async (id) => { if (window.confirm("¿Estás seguro de eliminar este contacto?")) { await fetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' }); setContacts(contacts.filter(c => c._id !== id)); } };
  const openContactModal = (contact = null) => { setCurrentContact(contact); setContactModalVisible(true); };
  const closeContactModal = () => { setCurrentContact(null); setContactModalVisible(false); };
  
  // --- Renderizado ---
  const renderAgendaView = () => ( <div> <div style={styles.calendarHeader}> <button onClick={() => changeWeek(-1)} style={styles.calendarNavButton}>{"< Ant"}</button> <h2 style={styles.calendarTitle}>{`Semana del ${weekDays[0].toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})} al ${weekDays[6].toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'})}`}</h2> <button onClick={() => changeWeek(1)} style={styles.calendarNavButton}>{"Sig >"}</button> </div> <div style={styles.calendarGrid}> {weekDays.map(day => { 
        // CAMBIO: Corrección de la fecha
        const dayTasks = tasks.filter(t => {
            if (t.status !== 'pendiente') return false;
            const taskDate = new Date(t.date);
            // Compara año, mes y día en UTC para evitar problemas de timezone
            return taskDate.getUTCFullYear() === day.getFullYear() &&
                   taskDate.getUTCMonth() === day.getMonth() &&
                   taskDate.getUTCDate() === day.getDate();
        });
        return ( <div key={day.toISOString()} style={styles.dayColumn}> <div style={styles.dayHeader}> <p style={styles.dayName}>{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p> <p style={styles.dayNumber}>{day.getDate()}</p> </div> <div style={styles.dayTasks}> {dayTasks.map(task => { const contact = contacts.find(c => c._id === task.contactId); return ( <div key={task._id} style={styles.taskCard} onClick={() => openTaskModal(task)}> <p style={styles.taskCardTitle}>{task.title}</p> <p style={styles.taskCardTime}>{task.time}</p> {contact && <p style={styles.taskCardContact}>{contact.name}</p>} </div> ) })} </div> </div> ); })} </div> </div> );
  const renderContactosView = () => { const filteredContacts = contacts.filter(c => contactFilter === 'todos' ? true : c.type === contactFilter); return ( <div> <div style={styles.filterContainer}> <button onClick={() => setContactFilter('todos')} style={contactFilter === 'todos' ? styles.filterButtonActive : styles.filterButton}>Todos</button> <button onClick={() => setContactFilter('juridico')} style={contactFilter === 'juridico' ? styles.filterButtonActive : styles.filterButton}>Grandes Clientes</button> <button onClick={() => setContactFilter('personal')} style={contactFilter === 'personal' ? styles.filterButtonActive : styles.filterButton}>Personales</button> </div> <div style={styles.contactList}> {filteredContacts.map(contact => ( <div key={contact._id} style={styles.contactCard} onClick={() => openContactModal(contact)}> <div> <h3 style={styles.contactName}>{contact.name}</h3> <p style={styles.contactAddress}>{contact.phone}</p> {/* <-- CAMBIO: Muestra el teléfono */} </div> </div> ))} </div> </div> ); };

  return ( <> <GlobalStyles /> <div style={styles.container}> <header style={styles.header}> <div> <h1 style={styles.headerTitle}>Servicio Técnico Completo</h1> <p style={styles.headerSubtitle}>Gestión de Citas y Clientes</p> </div> <nav style={styles.nav}> <button onClick={() => setCurrentView('agenda')} style={currentView === 'agenda' ? styles.navButtonActive : styles.navButton}>Agenda</button> <button onClick={() => setCurrentView('contactos')} style={currentView === 'contactos' ? styles.navButtonActive : styles.navButton}>Contactos</button> </nav> </header> <main style={styles.mainContent}> {currentView === 'agenda' ? renderAgendaView() : renderContactosView()} </main> <button style={styles.fab} onClick={() => currentView === 'agenda' ? openTaskModal(null) : openContactModal(null)}> <PlusIcon /> </button> {taskModalVisible && <TaskModal task={currentTask} contacts={contacts} onSave={handleSaveTask} onClose={closeTaskModal} onDelete={handleDeleteTask} onComplete={handleCompleteTask}/>} {contactModalVisible && <ContactModal contact={currentContact} tasks={tasks} onSave={handleSaveContact} onClose={closeContactModal} onDelete={handleDeleteContact} />} {reminder && <ReminderModal reminder={reminder} onClose={() => setReminder(null)} />} {/* <-- CAMBIO: Modal de recordatorio */} </div> </> );
};

// --- Modales ---
const TaskModal = ({ task, contacts, onSave, onClose, onDelete, onComplete }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [date, setDate] = useState(task?.date ? task.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(task?.time || '09:00');
    const [contactId, setContactId] = useState(task?.contactId || '');
    const [reminderMinutes, setReminderMinutes] = useState(task?.reminderMinutes || 15);
    // CAMBIO: Estado para la búsqueda de contactos
    const [contactSearch, setContactSearch] = useState('');

    const handleSubmit = () => { onSave({ _id: task?._id, title, description, date, time, contactId, reminderMinutes }); };
    
    // CAMBIO: Filtra los contactos según la búsqueda
    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(contactSearch.toLowerCase())
    );

    return (
      <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
              <h3>{task ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
              <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
              <textarea placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} />
              <div style={{display: 'flex', gap: '10px'}}>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{flex: 1}}/>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{flex: 1}}/>
              </div>
              
              {/* CAMBIO: Campo de búsqueda y selector de contacto */}
              <label>Asignar a Contacto</label>
              <input type="text" placeholder="Buscar contacto..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
              <select value={contactId} onChange={e => setContactId(e.target.value)}>
                  <option value="">Ninguno</option>
                  {filteredContacts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>

              <label>Recordar (minutos antes)</label>
              <input type="number" value={reminderMinutes} onChange={e => setReminderMinutes(parseInt(e.target.value, 10) || 0)} />

              <div style={styles.modalActions}>
                  {task && <button style={styles.buttonDanger} onClick={() => onDelete(task._id)}><TrashIcon/></button>}
                  <button style={styles.buttonSecondary} onClick={onClose}>Cancelar</button>
                  <button style={styles.buttonPrimary} onClick={handleSubmit}>Guardar</button>
                  {task && task.status === 'pendiente' && (
                    <button style={styles.buttonSuccess} onClick={() => onComplete(task._id)} title="Marcar como Completado">
                        <CheckIcon />
                    </button>
                  )}
              </div>
          </div>
      </div>
    );
};

const ContactModal = ({ contact, tasks, onSave, onClose, onDelete }) => {
    const [name, setName] = useState(contact?.name || '');
    const [phone, setPhone] = useState(contact?.phone || ''); // <-- CAMBIO: Estado para teléfono
    const [address, setAddress] = useState(contact?.address || '');
    const [type, setType] = useState(contact?.type || 'personal');
    const [equipment, setEquipment] = useState(contact?.equipment || { lavadoras: 0, cocinas: 0, refri: 0, ac: 0 });
    const handleEquipmentChange = (key, value) => setEquipment(prev => ({ ...prev, [key]: Math.max(0, parseInt(value, 10) || 0) }));
    const handleSubmit = () => { onSave({ _id: contact?._id, name, phone, address, type, equipment }); };
    
    const history = contact ? tasks
        .filter(t => t.contactId === contact._id && t.status === 'completado')
        .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate)) : [];

    return (
        <div style={styles.modalBackdrop}>
            <div style={{...styles.modalContent, maxHeight: '90vh', overflowY: 'auto'}}>
                <h3>{contact ? 'Detalles del Contacto' : 'Nuevo Contacto'}</h3>
                <input type="text" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} />
                <input type="tel" placeholder="Número de celular" value={phone} onChange={e => setPhone(e.target.value)} /> {/* <-- CAMBIO: Campo para teléfono */}
                <input type="text" placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} />
                <select value={type} onChange={e => setType(e.target.value)}>
                    <option value="personal">Personal</option>
                    <option value="juridico">Jurídico</option>
                </select>
                <h4>Equipos</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                    <label>Lavadoras <input type="number" value={equipment.lavadoras} onChange={e => handleEquipmentChange('lavadoras', e.target.value)} /></label>
                    <label>Cocinas <input type="number" value={equipment.cocinas} onChange={e => handleEquipmentChange('cocinas', e.target.value)} /></label>
                    <label>Refrigeradores <input type="number" value={equipment.refri} onChange={e => handleEquipmentChange('refri', e.target.value)} /></label>
                    <label>Aires Acond. <input type="number" value={equipment.ac} onChange={e => handleEquipmentChange('ac', e.target.value)} /></label>
                </div>
                {contact && (
                    <div style={styles.historySection}>
                        <h4>Historial de Mantenimiento</h4>
                        {history.length > 0 ? (
                            history.map(task => (
                                <div key={task._id} style={styles.historyItem}>
                                    <span>{new Date(task.completedDate).toLocaleDateString()}</span>
                                    <span>{task.title}</span>
                                </div>
                            ))
                        ) : <p>No hay trabajos completados.</p>}
                    </div>
                )}
                <div style={styles.modalActions}>
                    {contact && <button style={styles.buttonDanger} onClick={() => onDelete(contact._id)}><TrashIcon/></button>}
                    <button style={styles.buttonSecondary} onClick={onClose}>Cerrar</button>
                    <button style={styles.buttonPrimary} onClick={handleSubmit}>Guardar</button>
                </div>
            </div>
        </div>
    );
};

// CAMBIO: Nuevo modal para los recordatorios
const ReminderModal = ({ reminder, onClose }) => (
    <div style={styles.modalBackdrop}>
        <div style={styles.modalContent}>
            <h3 style={{color: 'var(--primary-color)'}}>⏰ Recordatorio de Cita</h3>
            <p style={{marginTop: '15px', fontSize: '18px'}}>La cita <strong>"{reminder.title}"</strong> para <strong>{reminder.contactName || 'N/A'}</strong> es pronto.</p>
            <p style={{marginTop: '5px', fontSize: '16px', color: 'var(--light-font-color)'}}>
                Fecha: {new Date(reminder.date + 'T00:00:00').toLocaleDateString()} a las {reminder.time}
            </p>
            <div style={styles.modalActions}>
                <button style={styles.buttonPrimary} onClick={onClose}>Entendido</button>
            </div>
        </div>
    </div>
);


// --- Estilos (sin cambios) ---
const styles = { container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '80px' }, header: { padding: '20px', backgroundColor: 'var(--white-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }, headerTitle: { fontSize: 24, fontWeight: 'bold' }, headerSubtitle: { fontSize: 16, color: 'var(--light-font-color)', marginTop: 4 }, nav: { display: 'flex', gap: '10px', marginTop: '10px' }, navButton: { padding: '10px 20px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--primary-color)', fontWeight: '600' }, navButtonActive: { padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'var(--white-color)', fontWeight: '600' }, mainContent: { padding: '20px', flex: 1 }, calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }, calendarTitle: { fontSize: '20px', textAlign: 'center' }, calendarNavButton: { padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--white-color)', border: '1px solid var(--border-color)', fontWeight: '500' }, calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minHeight: '60vh' }, dayColumn: { backgroundColor: 'var(--white-color)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }, dayHeader: { padding: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }, dayName: { fontWeight: '600', fontSize: '14px', color: 'var(--light-font-color)' }, dayNumber: { fontWeight: 'bold', fontSize: '18px' }, dayTasks: { padding: '10px', flex: 1, overflowY: 'auto' }, taskCard: { backgroundColor: '#ecf0f1', padding: '10px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }, taskCardTitle: { fontWeight: 'bold', fontSize: '14px' }, taskCardTime: { fontSize: '12px', color: 'var(--primary-color)', fontWeight: 'bold' }, taskCardContact: { fontSize: '12px', color: '#34495e', fontStyle: 'italic', marginTop: '4px' }, filterContainer: { marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }, filterButton: { padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--white-color)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', fontWeight: '500' }, filterButtonActive: { padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', border: '1px solid var(--primary-color)', color: 'var(--white-color)', fontWeight: '500' }, contactList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }, contactCard: { backgroundColor: 'var(--white-color)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }, contactName: { fontSize: '18px', fontWeight: 'bold' }, contactAddress: { fontSize: '14px', color: 'var(--light-font-color)', margin: '4px 0 10px 0' }, fab: { position: 'fixed', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: 'var(--primary-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 99 }, modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }, modalContent: { backgroundColor: 'var(--white-color)', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '600px' }, modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }, buttonPrimary: { padding: '12px 20px', backgroundColor: 'var(--primary-color)', color: 'var(--white-color)', borderRadius: '8px', fontWeight: '600' }, buttonSecondary: { padding: '12px 20px', backgroundColor: '#bdc3c7', color: 'var(--white-color)', borderRadius: '8px', fontWeight: '600' }, buttonDanger: { padding: '12px', backgroundColor: 'transparent', color: 'var(--danger-color)', borderRadius: '8px' }, buttonSuccess: { padding: '12px', backgroundColor: 'var(--success-color)', color: 'var(--white-color)', borderRadius: '8px' }, historySection: { marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }, historyItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f2f2f2' } };

export default App;

