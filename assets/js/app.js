const STORAGE_KEY = "contact_practice_v1";
const form = document.getElementById("contactForm");
const statusBox = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const cancelBtn = document.getElementById("cancelBtn");
const listEl = document.getElementById("contactList");
const counterEl = document.getElementById("counter");
const loadingEl = document.getElementById("loading");
const searchEl = document.getElementById("search");
const confirmModal = document.getElementById("confirmModal");
const confirmMsg = document.getElementById("confirmMsg");
const confirmYes = document.getElementById("confirmYes") || document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

const fields = {
	name: document.getElementById("name"),
	lastname: document.getElementById("lastname"),
	phone: document.getElementById("phone"),
	city: document.getElementById("city"),
	address: document.getElementById("address")
};

const state = {
	contacts: [],
	editingId: null,
	filter: ""
};

function showLoading(show) {
	loadingEl.classList.toggle("show", show);
}

function readStorage() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function writeStorage(data) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function fakeDb(action) {
	showLoading(true);
	return new Promise((resolve) => {
		setTimeout(() => {
			const result = action();
			showLoading(false);
			resolve(result);
		}, 450);
	});
}

function getSelectedGender() {
	const selected = form.querySelector("input[name='gender']:checked");
	return selected ? selected.value : "";
}

function clearStatus() {
	statusBox.textContent = "";
	statusBox.className = "status";
}

function setStatus(message, kind) {
	statusBox.textContent = message;
	statusBox.className = `status ${kind}`;
}

function normalizeValue(value) {
	return value.trim();
}

function showFieldError(name, msg) {
	const el = document.querySelector(`.field-error[data-for="${name}"]`);
	if (el) el.textContent = msg || "";
}

function clearFieldErrors() {
	document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
}

function validateInputs(values) {
	clearFieldErrors();
	const errors = {};

	Object.entries(values).forEach(([k, v]) => {
		if (!normalizeValue(v)) errors[k] = 'Este campo es obligatorio.';
	});

	if (!getSelectedGender()) errors.gender = 'Selecciona un genero.';

	// phone pattern: allow +, digits, spaces and dashes, min 6
	const phone = normalizeValue(values.phone || '');
	const phoneRe = /^\+?[0-9\s\-]{6,20}$/;
	if (phone && !phoneRe.test(phone)) errors.phone = 'Telefono no valido.';

	Object.keys(errors).forEach(k => showFieldError(k, errors[k]));

	const valid = Object.keys(errors).length === 0;
	return { valid, errors };
}

function getFormData() {
	return {
		name: normalizeValue(fields.name.value),
		lastname: normalizeValue(fields.lastname.value),
		phone: normalizeValue(fields.phone.value),
		city: normalizeValue(fields.city.value),
		address: normalizeValue(fields.address.value),
		gender: getSelectedGender()
	};
}

function updateCounter(count) {
	const total = typeof count === 'number' ? count : state.contacts.length;
	counterEl.textContent = `${total} ${total === 1 ? "registro" : "registros"}`;
}

function resetForm() {
	form.reset();
	state.editingId = null;
	saveBtn.textContent = "Agregar contacto";
	clearStatus();
	clearFieldErrors();
}

function renderContacts() {
	listEl.innerHTML = "";

	const filter = (state.filter || '').toLowerCase();
	let toRender = state.contacts.slice();
	if (filter) {
		toRender = toRender.filter(c => (`${c.name} ${c.lastname}`.toLowerCase().includes(filter) || (c.city || '').toLowerCase().includes(filter)));
	}

	if (!toRender.length) {
		listEl.innerHTML = '<li class="empty">No hay contactos guardados aun.</li>';
		updateCounter(toRender.length);
		return;
	}

	const html = toRender.map((contact) => {
		const genderClass = contact.gender === "female" ? "female" : "male";
		const genderIcon = contact.gender === "female" ? "fa-venus" : "fa-mars";

		return `
			<li class="contact-item" data-id="${contact.id}" role="listitem">
				<div class="contact-main">
					<span class="avatar ${genderClass}" aria-hidden="true">
						<i class="fa-solid ${genderIcon}"></i>
					</span>
					<div>
						<div class="person">${contact.name} ${contact.lastname}</div>
						<div class="meta">${contact.city} | ${contact.phone} | ${contact.address}</div>
					</div>
				</div>

				<div class="item-actions">
					<button type="button" class="icon-btn edit" data-action="edit" title="Editar contacto" aria-label="Editar">
						<i class="fa-regular fa-pen-to-square"></i>
					</button>
					<button type="button" class="icon-btn delete" data-action="delete" title="Eliminar contacto" aria-label="Eliminar">
						<i class="fa-solid fa-trash"></i>
					</button>
				</div>
			</li>
		`;
	}).join("");

	listEl.innerHTML = html;
	updateCounter(toRender.length);
}

async function createContact(contactData) {
	await fakeDb(() => {
		const newContact = { id: crypto.randomUUID(), ...contactData };
		state.contacts.unshift(newContact);
		writeStorage(state.contacts);
	});

	setStatus("Contacto creado correctamente.", "success");
	resetForm();
	renderContacts();
}

async function updateContact(contactData) {
	await fakeDb(() => {
		state.contacts = state.contacts.map((item) => item.id === state.editingId ? { ...item, ...contactData } : item);
		writeStorage(state.contacts);
	});

	setStatus("Contacto actualizado correctamente.", "success");
	resetForm();
	renderContacts();
}

async function deleteContact(id) {
	await fakeDb(() => {
		state.contacts = state.contacts.filter((item) => item.id !== id);
		writeStorage(state.contacts);
	});

	setStatus("Contacto eliminado.", "success");
	if (state.editingId === id) resetForm();
	renderContacts();
}

function loadContactIntoForm(id) {
	const target = state.contacts.find((item) => item.id === id);
	if (!target) return;

	fields.name.value = target.name;
	fields.lastname.value = target.lastname;
	fields.phone.value = target.phone;
	fields.city.value = target.city;
	fields.address.value = target.address;

	const radio = form.querySelector(`input[name='gender'][value='${target.gender}']`);
	if (radio) radio.checked = true;

	state.editingId = target.id;
	saveBtn.textContent = "Actualizar contacto";
	setStatus("Editando contacto seleccionado.", "success");
}

function showConfirm(message) {
	return new Promise((resolve) => {
		if (!confirmModal) return resolve(window.confirm(message));

		confirmMsg.textContent = message;
		confirmModal.setAttribute('aria-hidden', 'false');

		function onYes() {
			cleanup();
			resolve(true);
		}

		function onNo() {
			cleanup();
			resolve(false);
		}

		function cleanup() {
			confirmModal.setAttribute('aria-hidden', 'true');
			confirmYes.removeEventListener('click', onYes);
			confirmNo.removeEventListener('click', onNo);
		}

		confirmYes.addEventListener('click', onYes);
		confirmNo.addEventListener('click', onNo);
		// focus yes for keyboard users
		confirmYes.focus();
	});
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const valuesToValidate = {
		name: fields.name.value,
		lastname: fields.lastname.value,
		phone: fields.phone.value,
		city: fields.city.value,
		address: fields.address.value
	};

	const validation = validateInputs(valuesToValidate);
	if (!validation.valid) {
		setStatus("Corrige los errores en el formulario.", "error");
		return;
	}

	const contactData = getFormData();

	if (state.editingId) {
		await updateContact(contactData);
	} else {
		await createContact(contactData);
	}
});

clearBtn.addEventListener("click", () => {
	resetForm();
	setStatus("Formulario limpio.", "success");
});

cancelBtn.addEventListener('click', () => {
	resetForm();
	setStatus('Edición cancelada.', 'success');
});

listEl.addEventListener("click", async (event) => {
	const actionButton = event.target.closest("button[data-action]");
	if (!actionButton) return;

	const card = actionButton.closest(".contact-item");
	if (!card) return;

	const id = card.dataset.id;
	const action = actionButton.dataset.action;

	if (action === "edit") {
		loadContactIntoForm(id);
		return;
	}

	if (action === "delete") {
		const ok = await showConfirm('¿Eliminar este contacto?');
		if (ok) await deleteContact(id);
	}
});

searchEl?.addEventListener('input', (e) => {
	state.filter = e.target.value || '';
	renderContacts();
});

function seedIfEmpty() {
	const current = readStorage();
	if (Array.isArray(current) && current.length) {
		state.contacts = current;
		return;
	}

	const sample = [
		{ id: crypto.randomUUID(), name: 'Pepito', lastname: 'Perez', phone: '+573001112233', city: 'Cali', address: 'Calle 1 #2-3', gender: 'male' },
		{ id: crypto.randomUUID(), name: 'Fabiola', lastname: 'Perea', phone: '+573004445566', city: 'Palmira', address: 'Av 10 #20-30', gender: 'female' }
	];

	state.contacts = sample;
	writeStorage(state.contacts);
}

function init() {
	seedIfEmpty();
	renderContacts();
}

init();
