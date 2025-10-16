import React, { useState, useEffect, useCallback } from 'react';

// --- Estilos Globales ---
const GlobalStyles = () => ( <style>{` :root { --primary-color: #2a68c7; --secondary-color: #f4f7fe; --font-color: #34495e; --light-font-color: #6a738c; --border-color: #e0e5f5; --white-color: #ffffff; --danger-color: #e74c3c; --success-color: #2ecc71; } body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: var(--secondary-color); color: var(--font-color); } * { box-sizing: border-box; } button { cursor: pointer; border: none; font-family: inherit; transition: background-color 0.2s ease; } input, textarea, select { font-family: inherit; width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 15px; font-size: 16px; } h1, h2, h3, p { margin: 0; } `}</style> );

// --- Componentes de Íconos (SVG) ---
const PlusIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg> );
const TrashIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M3 6H5H21" stroke="var(--danger-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="var(--danger-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg> );
const CheckIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg> );
const PhoneIcon = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px', verticalAlign: 'middle' }}> <path d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94m-1 7.98v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="var(--light-font-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg> );
const MapPinIcon = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px', verticalAlign: 'middle' }}> <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="var(--light-font-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> <path d="M12 10a3 3 0 100-6 3 3 0 000 6z" stroke="var(--light-font-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg> );

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
  const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'denied');
  
  const API_URL = 'https://stc-app.onrender.com/api';

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones de escritorio.');
      return;
    }
    // Solo pedir permiso si está en estado 'default'
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const tasksRes = await fetch(`${API_URL}/tasks`);
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]);
    }
    try {
      const contactsRes = await fetch(`${API_URL}/contacts`);
      const contactsData = await contactsRes.json();
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setContacts([]);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sistema de recordatorios con notificaciones de navegador
  useEffect(() => {
    const checkReminders = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status === 'pendiente' && task.reminder?.value > 0) {
          const taskDate = new Date(`${task.date}T${task.time}`);
          let reminderTime = new Date(taskDate);
          
          switch (task.reminder.unit) {
            case 'minutes':
              reminderTime.setMinutes(taskDate.getMinutes() - task.reminder.value);
              break;
            case 'hours':
              reminderTime.setHours(taskDate.getHours() - task.reminder.value);
              break;
            case 'days':
              reminderTime.setDate(taskDate.getDate() - task.reminder.value);
              break;
            default:
              break;
          }

          const reminderFiredKey = `reminder_fired_${task._id}`;
          if (now >= reminderTime && now < taskDate && !sessionStorage.getItem(reminderFiredKey)) {
            if (notificationPermission === 'granted') {
                console.log(`Disparando notificación para: ${task.title}`); // Ayuda para depuración
                new Notification('Recordatorio de Tarea', {
                    body: `Hoy a las ${task.time}: ${task.title}`,
                    // icon: 'logo192.png' // Eliminado para evitar errores si el archivo no existe
                });
                sessionStorage.setItem(reminderFiredKey, 'true');
            }
          }
        }
      });
    }, 60000); // Revisa cada minuto

    return () => clearInterval(checkReminders);
  }, [tasks, notificationPermission]);

  const getWeekDays = (date) => { const startDate = new Date(date); const day = startDate.getDay(); const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); startDate.setDate(diff); return Array.from({ length: 7 }, (_, i) => { const d = new Date(startDate); d.setDate(startDate.getDate() + i); return d; }); };
  const weekDays = getWeekDays(currentDate);
  const changeWeek = (dir) => { const newDate = new Date(currentDate); newDate.setDate(newDate.getDate() + (dir * 7)); setCurrentDate(newDate); };
  
  const handleSaveTask = async (taskData) => { if (taskData._id) { await fetch(`${API_URL}/tasks/${taskData._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskData) }); } else { await fetch(`${API_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskData) }); } fetchData(); closeTaskModal(); };
  const handleCompleteTask = async (id) => { await fetch(`${API_URL}/tasks/${id}/complete`, { method: 'PATCH' }); fetchData(); closeTaskModal(); };
  const handleDeleteTask = async (id) => { if (window.confirm("¿Seguro que quieres ELIMINAR PERMANENTEMENTE esta tarea?")) { await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' }); fetchData(); closeTaskModal(); } };
  const openTaskModal = (task = null) => { setCurrentTask(task); setTaskModalVisible(true); };
  const closeTaskModal = () => { setCurrentTask(null); setTaskModalVisible(false); };
  
  const handleSaveContact = async (contactData) => { if (contactData._id) { await fetch(`${API_URL}/contacts/${contactData._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactData) }); } else { await fetch(`${API_URL}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactData) }); } fetchData(); closeContactModal(); };
  const handleDeleteContact = async (id) => { if (window.confirm("¿Estás seguro de eliminar este contacto?")) { await fetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' }); fetchData(); } };
  const openContactModal = (contact = null) => { setCurrentContact(contact); setContactModalVisible(true); };
  const closeContactModal = () => { setCurrentContact(null); setContactModalVisible(false); };
  
  const renderAgendaView = () => ( <div> <div style={styles.calendarHeader}> <button onClick={() => changeWeek(-1)} style={styles.calendarNavButton}>{"< Ant"}</button> <h2 style={styles.calendarTitle}>{`Semana del ${weekDays[0].toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})} al ${weekDays[6].toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'})}`}</h2> <button onClick={() => changeWeek(1)} style={styles.calendarNavButton}>{"Sig >"}</button> </div> <div style={styles.calendarGrid}> {weekDays.map(day => { const dayTasks = tasks.filter(t => { if (t.status !== 'pendiente' || !t.date) return false; const taskDate = new Date(t.date); const userTimezoneOffset = taskDate.getTimezoneOffset() * 60000; const correctedDate = new Date(taskDate.getTime() + userTimezoneOffset); return correctedDate.toDateString() === day.toDateString(); }); return ( <div key={day.toISOString()} style={styles.dayColumn}> <div style={styles.dayHeader}> <p style={styles.dayName}>{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p> <p style={styles.dayNumber}>{day.getDate()}</p> </div> <div style={styles.dayTasks}> {dayTasks.map(task => { const contact = contacts.find(c => c._id === task.contactId); return ( <div key={task._id} style={styles.taskCard} onClick={() => openTaskModal(task)}> <p style={styles.taskCardTitle}>{task.title}</p> <p style={styles.taskCardTime}>{task.time}</p> {contact && <p style={styles.taskCardContact}>{contact.name}</p>} </div> ) })} </div> </div> ); })} </div> </div> );
  const renderContactosView = () => { const filteredContacts = contacts.filter(c => contactFilter === 'todos' ? true : c.type === contactFilter); return ( <div> <div style={styles.filterContainer}> <button onClick={() => setContactFilter('todos')} style={contactFilter === 'todos' ? styles.filterButtonActive : styles.filterButton}>Todos</button> <button onClick={() => setContactFilter('juridico')} style={contactFilter === 'juridico' ? styles.filterButtonActive : styles.filterButton}>Grandes Clientes</button> <button onClick={() => setContactFilter('personal')} style={contactFilter === 'personal' ? styles.filterButtonActive : styles.filterButton}>Personales</button> </div> <div style={styles.contactList}> {filteredContacts.map(contact => ( <div key={contact._id} style={styles.contactCard} onClick={() => openContactModal(contact)}> <div> <h3 style={styles.contactName}>{contact.name}</h3> {contact.phone && <p style={styles.contactInfo}><PhoneIcon />{contact.phone}</p>} {contact.address && <p style={styles.contactInfo}><MapPinIcon />{contact.address}</p>} </div> </div> ))} </div> </div> ); };

  return ( <> <GlobalStyles /> <div style={styles.container}> <header style={styles.header}> <div style={{flexGrow: 1}}> <h1 style={styles.headerTitle}>Servicio Técnico Completo</h1> <p style={styles.headerSubtitle}>Gestión de Citas y Clientes</p> </div> <div style={{display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap'}}> <nav style={styles.nav}> <button onClick={() => setCurrentView('agenda')} style={currentView === 'agenda' ? styles.navButtonActive : styles.navButton}>Agenda</button> <button onClick={() => setCurrentView('contactos')} style={currentView === 'contactos' ? styles.navButtonActive : styles.navButton}>Contactos</button> </nav> <div style={styles.notificationControl}> <button onClick={requestNotificationPermission} style={styles.notificationButton} title="Estado de las notificaciones" disabled={notificationPermission !== 'default'}> {notificationPermission === 'granted' ? '🔔 Notificaciones Activas' : (notificationPermission === 'denied' ? '🔕 Notificaciones Bloqueadas' : 'Activar Notificaciones')} </button> </div> </div> </header> <main style={styles.mainContent}> {currentView === 'agenda' ? renderAgendaView() : renderContactosView()} </main> <button style={styles.fab} onClick={() => currentView === 'agenda' ? openTaskModal(null) : openContactModal(null)}> <PlusIcon /> </button> {taskModalVisible && <TaskModal task={currentTask} contacts={contacts} onSave={handleSaveTask} onClose={closeTaskModal} onDelete={handleDeleteTask} onComplete={handleCompleteTask}/>} {contactModalVisible && <ContactModal contact={currentContact} tasks={tasks} onSave={handleSaveContact} onClose={closeContactModal} onDelete={handleDeleteContact} />} </div> </> );
};

const TaskModal = ({ task, contacts, onSave, onClose, onDelete, onComplete }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [date, setDate] = useState(task?.date ? task.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(task?.time || '09:00');
  const [contactId, setContactId] = useState(task?.contactId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [reminderValue, setReminderValue] = useState(task?.reminder?.value || 10);
  const [reminderUnit, setReminderUnit] = useState(task?.reminder?.unit || 'minutes');

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = () => { onSave({ _id: task?._id, title, description, date, time, contactId, reminder: { value: reminderValue, unit: reminderUnit } }); };
  return ( <div style={styles.modalBackdrop}> <div style={styles.modalContent}> <h3>{task ? 'Editar Tarea' : 'Nueva Tarea'}</h3> <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} /> <textarea placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} /> <div style={{display: 'flex', gap: '10px'}}> <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{flex: 1}}/> <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{flex: 1}}/> </div> <h4>Asignar a Contacto</h4> <input type="text" placeholder="Buscar contacto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /> <select value={contactId} onChange={e => setContactId(e.target.value)} size={filteredContacts.length > 1 ? 4 : 2} style={{height: 'auto'}}> <option value="">Ninguno</option> {filteredContacts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)} </select> <h4>Recordatorio</h4> <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}> <input type="number" value={reminderValue} onChange={e => setReminderValue(parseInt(e.target.value, 10) || 0)} style={{flex: 1}}/> <select value={reminderUnit} onChange={e => setReminderUnit(e.target.value)} style={{flex: 2}}> <option value="minutes">Minutos antes</option> <option value="hours">Horas antes</option> <option value="days">Días antes</option> </select> </div> <div style={styles.modalActions}> {task && <button style={styles.buttonDanger} onClick={() => onDelete(task._id)}><TrashIcon/></button>} <button style={styles.buttonSecondary} onClick={onClose}>Cancelar</button> <button style={styles.buttonPrimary} onClick={handleSubmit}>Guardar</button> {task && task.status === 'pendiente' && ( <button style={styles.buttonSuccess} onClick={() => onComplete(task._id)} title="Marcar como Completado"> <CheckIcon /> </button> )} </div> </div> </div> );
};

const ContactModal = ({ contact, tasks, onSave, onClose, onDelete }) => { const [name, setName] = useState(contact?.name || ''); const [phone, setPhone] = useState(contact?.phone || ''); const [address, setAddress] = useState(contact?.address || ''); const [type, setType] = useState(contact?.type || 'personal'); const [equipment, setEquipment] = useState(contact?.equipment || { lavadoras: 0, cocinas: 0, refri: 0, ac: 0 }); const handleEquipmentChange = (key, value) => setEquipment(prev => ({ ...prev, [key]: Math.max(0, parseInt(value, 10) || 0) })); const handleSubmit = () => { onSave({ _id: contact?._id, name, phone, address, type, equipment }); }; const history = contact ? tasks .filter(t => t.contactId === contact._id && t.status === 'completado') .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate)) : []; return ( <div style={styles.modalBackdrop}> <div style={{...styles.modalContent, maxHeight: '90vh', overflowY: 'auto'}}> <h3>{contact ? 'Detalles del Contacto' : 'Nuevo Contacto'}</h3> <input type="text" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} /> <input type="text" placeholder="Número de Celular" value={phone} onChange={e => setPhone(e.target.value)} /> <input type="text" placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} /> <select value={type} onChange={e => setType(e.target.value)}> <option value="personal">Personal</option> <option value="juridico">Jurídico</option> </select> <h4>Equipos</h4> <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}> <label>Lavadoras <input type="number" value={equipment.lavadoras} onChange={e => handleEquipmentChange('lavadoras', e.target.value)} /></label> <label>Cocinas <input type="number" value={equipment.cocinas} onChange={e => handleEquipmentChange('cocinas', e.target.value)} /></label> <label>Refrigeradores <input type="number" value={equipment.refri} onChange={e => handleEquipmentChange('refri', e.target.value)} /></label> <label>Aires Acond. <input type="number" value={equipment.ac} onChange={e => handleEquipmentChange('ac', e.target.value)} /></label> </div> {contact && ( <div style={styles.historySection}> <h4>Historial de Mantenimiento</h4> {history.length > 0 ? ( history.map(task => ( <div key={task._id} style={styles.historyItem}> <span>{new Date(task.completedDate).toLocaleDateString()}</span> <span>{task.title}</span> </div> )) ) : <p>No hay trabajos completados.</p>} </div> )} <div style={styles.modalActions}> {contact && <button style={styles.buttonDanger} onClick={() => onDelete(contact._id)}><TrashIcon/></button>} <button style={styles.buttonSecondary} onClick={onClose}>Cerrar</button> <button style={styles.buttonPrimary} onClick={handleSubmit}>Guardar</button> </div> </div> </div> ); };

// --- Estilos ---
const styles = { container: { display: 'flex', flexDirection: 'column', minHeight: '100vh' }, header: { padding: '20px', backgroundColor: 'var(--white-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }, headerTitle: { fontSize: 24, fontWeight: 'bold' }, headerSubtitle: { fontSize: 16, color: 'var(--light-font-color)', marginTop: 4 }, nav: { display: 'flex', gap: '10px' }, navButton: { padding: '10px 20px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--primary-color)', fontWeight: '600' }, navButtonActive: { padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'var(--white-color)', fontWeight: '600' }, notificationControl: { }, notificationButton: { padding: '10px 15px', borderRadius: '8px', backgroundColor: 'var(--secondary-color)', color: 'var(--font-color)', fontWeight: '500', border: '1px solid var(--border-color)', fontSize: '14px' }, mainContent: { padding: '20px', flex: 1 }, calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }, calendarTitle: { fontSize: '20px', textAlign: 'center' }, calendarNavButton: { padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--white-color)', border: '1px solid var(--border-color)', fontWeight: '500' }, calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minHeight: '60vh' }, dayColumn: { backgroundColor: 'var(--white-color)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }, dayHeader: { padding: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }, dayName: { fontWeight: '600', fontSize: '14px', color: 'var(--light-font-color)' }, dayNumber: { fontWeight: 'bold', fontSize: '18px' }, dayTasks: { padding: '10px', flex: 1, overflowY: 'auto' }, taskCard: { backgroundColor: '#ecf0f1', padding: '10px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }, taskCardTitle: { fontWeight: 'bold', fontSize: '14px' }, taskCardTime: { fontSize: '12px', color: 'var(--primary-color)', fontWeight: 'bold' }, taskCardContact: { fontSize: '12px', color: '#34495e', fontStyle: 'italic', marginTop: '4px' }, filterContainer: { marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }, filterButton: { padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--white-color)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', fontWeight: '500' }, filterButtonActive: { padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', border: '1px solid var(--primary-color)', color: 'var(--white-color)', fontWeight: '500' }, contactList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }, contactCard: { backgroundColor: 'var(--white-color)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }, contactName: { fontSize: '18px', fontWeight: 'bold' }, contactInfo: { fontSize: '14px', color: 'var(--light-font-color)', margin: '8px 0 0 0', display: 'flex', alignItems: 'center' }, fab: { position: 'fixed', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: 'var(--primary-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 99 }, modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }, modalContent: { backgroundColor: 'var(--white-color)', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '600px' }, modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }, buttonPrimary: { padding: '12px 20px', backgroundColor: 'var(--primary-color)', color: 'var(--white-color)', borderRadius: '8px', fontWeight: '600' }, buttonSecondary: { padding: '12px 20px', backgroundColor: '#bdc3c7', color: 'var(--white-color)', borderRadius: '8px', fontWeight: '600' }, buttonDanger: { padding: '12px', backgroundColor: 'transparent', color: 'var(--danger-color)', borderRadius: '8px' }, buttonSuccess: { padding: '12px', backgroundColor: 'var(--success-color)', color: 'var(--white-color)', borderRadius: '8px' }, historySection: { marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }, historyItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f2f2f2' } };

export default App;
