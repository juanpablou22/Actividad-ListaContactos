const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Sirve tu frontend actual (index.html y assets/)
app.use(express.static(path.join(__dirname)));

// Base en memoria (se borra al reiniciar el server)
let contacts = [];
let nextId = 1;

function isValidContact(body) {
const required = ["name", "lastname", "phone", "city", "address", "gender"];
return required.every((field) => typeof body[field] === "string" && body[field].trim() !== "");
}

// GET: listar contactos
app.get("/api/contacts", (req, res) => {
res.json(contacts);
});

// POST: crear contacto
app.post("/api/contacts", (req, res) => {
if (!isValidContact(req.body)) {
return res.status(400).json({ message: "Datos incompletos o invalidos." });
}

const newContact = {
id: nextId++,
name: req.body.name.trim(),
lastname: req.body.lastname.trim(),
phone: req.body.phone.trim(),
city: req.body.city.trim(),
address: req.body.address.trim(),
gender: req.body.gender.trim()
};

contacts.unshift(newContact);
res.status(201).json(newContact);
});

// PUT: actualizar contacto
app.put("/api/contacts/:id", (req, res) => {
const id = Number(req.params.id);
const index = contacts.findIndex((c) => c.id === id);

if (index === -1) {
return res.status(404).json({ message: "Contacto no encontrado." });
}

if (!isValidContact(req.body)) {
return res.status(400).json({ message: "Datos incompletos o invalidos." });
}

contacts[index] = {
...contacts[index],
name: req.body.name.trim(),
lastname: req.body.lastname.trim(),
phone: req.body.phone.trim(),
city: req.body.city.trim(),
address: req.body.address.trim(),
gender: req.body.gender.trim()
};

res.json(contacts[index]);
});

// DELETE: eliminar contacto
app.delete("/api/contacts/:id", (req, res) => {
const id = Number(req.params.id);
const before = contacts.length;
contacts = contacts.filter((c) => c.id !== id);

if (contacts.length === before) {
return res.status(404).json({ message: "Contacto no encontrado." });
}

res.status(204).send();
});

app.listen(PORT, () => {
console.log("Servidor API corriendo en http://localhost:" + PORT);
});