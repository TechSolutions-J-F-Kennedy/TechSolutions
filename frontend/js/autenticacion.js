"use strict";

const API_URL =
  location.protocol === "file:" || location.port === "5500"
    ? "http://localhost:3000"
    : "";

const INICIO_POR_ROL = {
  tecnico: "inicio.html",
  usuario: "grupo-2/html/home.html",
};

const loginForm      = document.getElementById("login-form");
const registerForm   = document.getElementById("register-form");
const btnLogin       = document.getElementById("btn-login");
const btnRegistro    = document.getElementById("btn-registro");
const goToRegister   = document.getElementById("go-to-register");
const goToLogin      = document.getElementById("go-to-login");
const formSubtitle   = document.getElementById("form-subtitle");
const authMensaje    = document.getElementById("auth-mensaje");

function mostrarMensaje(texto, tipo = "error") {
  if (!authMensaje) return;
  authMensaje.textContent = texto;
  authMensaje.className = `auth-mensaje auth-mensaje--${tipo}`;
  authMensaje.hidden = false;
}

function limpiarMensaje() {
  if (!authMensaje) return;
  authMensaje.hidden = true;
  authMensaje.textContent = "";
}

if (goToRegister && registerForm && loginForm) {
  goToRegister.addEventListener("click", (e) => {
    e.preventDefault();
    limpiarMensaje();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    if (formSubtitle) formSubtitle.textContent = "Completá tus datos para crear una cuenta.";
  });
}

if (goToLogin && registerForm && loginForm) {
  goToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    limpiarMensaje();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    if (formSubtitle) formSubtitle.textContent = "Ingresá tus credenciales para acceder a la plataforma.";
  });
}

/* ── Login ── */
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    limpiarMensaje();

    const inputUser = document.getElementById("login-user") || document.getElementById("u");
    const inputPass = document.getElementById("login-password") || document.getElementById("p");

    const email = inputUser ? inputUser.value.trim() : "";
    const password = inputPass ? inputPass.value : "";

    if (!email || !password) {
      mostrarMensaje("Completá usuario y contraseña.");
      return;
    }

    if (btnLogin) {
      btnLogin.disabled = true;
      btnLogin.textContent = "Ingresando...";
    }

    try {
      const response = await fetch(`${API_URL}/api/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        mostrarMensaje(data.error || "Credenciales inválidas.");
        return;
      }

      const destino = INICIO_POR_ROL[data.usuario.rol] || "grupo-2/html/home.html";
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      window.location.href = destino;
    } catch {
      mostrarMensaje("No se pudo conectar con el servidor.");
    } finally {
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.innerHTML = '<i data-lucide="log-in"></i> Iniciar sesión';
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    }
  });
}

/* ── Registro ── */
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    limpiarMensaje();

    const nombre    = (document.getElementById("reg-username")?.value || "").trim();
    const email     = (document.getElementById("reg-email")?.value || "").trim();
    const telefono  = (document.getElementById("reg-phone")?.value || "").trim();
    const direccion = (document.getElementById("reg-address")?.value || "").trim();
    const password  = document.getElementById("reg-password")?.value || "";
    const confirmar = document.getElementById("reg-confirm-password")?.value || "";

    if (!nombre || !email || !password) {
      mostrarMensaje("Usuario, email y contraseña son obligatorios.");
      return;
    }
    if (password !== confirmar) {
      mostrarMensaje("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      mostrarMensaje("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (btnRegistro) {
      btnRegistro.disabled = true;
      btnRegistro.textContent = "Creando cuenta...";
    }

    try {
      const body = { nombre, email, password, telefono };
      if (direccion) {
        body.direccion = { direccion_completa: direccion };
      }

      const response = await fetch(`${API_URL}/api/usuarios/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        mostrarMensaje(data.error || "No se pudo crear la cuenta.");
        return;
      }

      mostrarMensaje("¡Cuenta creada con éxito! Ahora podés iniciar sesión.", "exito");
      registerForm.reset();

      setTimeout(() => {
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        if (formSubtitle) formSubtitle.textContent = "Ingresá tus credenciales para acceder a la plataforma.";
        limpiarMensaje();
      }, 1500);
    } catch {
      mostrarMensaje("No se pudo conectar con el servidor.");
    } finally {
      if (btnRegistro) {
        btnRegistro.disabled = false;
        btnRegistro.innerHTML = '<i data-lucide="user-plus"></i> Crear mi cuenta';
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    }
  });
}
