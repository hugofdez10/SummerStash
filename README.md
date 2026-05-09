<h1 align="center">🇺🇸 Summer Stash</h1>

<h3 align="center">
  Web app para gestionar dinero, gastos y objetivos durante una experiencia Work & Travel en USA
</h3>

<p align="center">
  <strong>Next.js · React · TypeScript · Supabase · Tailwind CSS · LocalStorage</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Work%20%26%20Travel-USA-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Finance-App-green?style=for-the-badge" />
</p>

---

## 📌 Descripción

**Summer Stash** es una aplicación web moderna y responsive pensada para jóvenes que van a trabajar durante el verano en Estados Unidos a través del programa **Work & Travel**.

La aplicación permite controlar de forma clara los ingresos, gastos previos al viaje, gastos diarios en USA, presupuestos, viajes, objetivos de ahorro y dinero disponible.

El objetivo principal es ayudar al usuario a entender rápidamente cuánto dinero tiene, cuánto puede gastar, cuánto debería reservar y cómo organizar mejor su economía durante toda la experiencia.

---

## 🎯 Motivación del proyecto

Este proyecto nace de una necesidad personal.

Voy a vivir la experiencia **Work & Travel USA** durante el verano, trabajando en Estados Unidos y aprovechando la oportunidad para viajar, conocer nuevos lugares y vivir una experiencia internacional.

Al planificar el viaje, me di cuenta de que iba a ser importante tener un buen control del dinero: por un lado, gestionar gastos previos como vuelos, agencia, seguro o transporte; por otro, controlar los gastos del día a día en Estados Unidos, reservar dinero para viajes y experiencias, y también intentar volver con algo de dinero ahorrado.

Por eso consideré necesario desarrollar una aplicación propia, adaptada exactamente a este tipo de experiencia, que no solo sirviera como app de finanzas personales, sino como una herramienta específica para jóvenes que se van a trabajar y viajar a Estados Unidos durante el verano.

---

## ✨ Funcionalidades principales

- Registro de ingresos previstos y reales.
- Control de gastos previos al viaje.
- Gestión de gastos diarios en Estados Unidos.
- Presupuestos por categoría.
- Objetivos de ahorro personalizados.
- Cálculo de dinero libre disponible.
- Estimación de gasto diario recomendado.
- Organización de dinero reservado para viajes y experiencias.
- Seguimiento de compras importantes.
- Fondo de emergencia.
- Dashboard visual y fácil de entender.
- Datos de ejemplo para probar la aplicación.
- Persistencia inicial con `localStorage`.
- Inicio de sesión con Supabase.
- Interfaz responsive y mobile-first.
- Modo oscuro.

---

## 🧭 Categorías de gestión

La aplicación está pensada para organizar el dinero en diferentes bloques:

### ✈️ Gastos previos al viaje

Gastos que se realizan antes de llegar a Estados Unidos, como:

- Agencia.
- Vuelos.
- Seguro.
- Visado.
- SEVIS.
- Transporte de llegada.
- Transporte de salida.
- Primer alojamiento si fuera necesario.

### 💵 Ingresos

Registro de ingresos relacionados con el trabajo de verano:

- Salario estimado.
- Salario real.
- Propinas si las hubiera.
- Otros ingresos adicionales.

### 🛒 Gastos diarios en USA

Control de gastos del día a día:

- Comida.
- Transporte.
- Compras.
- Ocio.
- Lavandería.
- Teléfono o eSIM.
- Otros gastos personales.

### 🗽 Viajes y experiencias

Bloque dedicado a reservar dinero para disfrutar de la experiencia:

- Viajes dentro de Estados Unidos.
- Excursiones.
- Entradas.
- Actividades.
- Transporte entre ciudades.
- Alojamiento durante viajes.

### 🎯 Objetivos de ahorro

Objetivos personales que el usuario quiere conseguir durante o después del verano:

- Volver con dinero ahorrado.
- Comprar un iPhone.
- Mantener un fondo de emergencia.
- Ahorrar para futuros viajes.
- Reservar dinero para gastos al volver.

---

## 🛠️ Stack tecnológico

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,supabase,vercel,git,github,vscode" />
</p>

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Diseño responsive
- Modo oscuro
- Interfaz mobile-first

### Backend & Persistencia

- Supabase Auth
- Supabase Database
- LocalStorage para persistencia inicial
- Datos de ejemplo para primera experiencia de uso

### Herramientas

- Git
- GitHub
- Vercel
- Visual Studio Code

---

## 📊 Dashboard

El dashboard está diseñado para que el usuario pueda entender su situación financiera en menos de 10 segundos.

Muestra información como:

- Dinero total disponible.
- Dinero reservado para objetivos.
- Gasto diario recomendado.
- Total gastado.
- Total ingresado.
- Presupuesto restante.
- Progreso de objetivos.
- Distribución por categorías.

---

## 📱 Enfoque mobile-first

Summer Stash está pensada principalmente para usarse desde el móvil, ya que durante la experiencia Work & Travel lo más probable es que el usuario quiera registrar gastos rápidamente desde cualquier lugar.

Por eso la interfaz está diseñada con:

- Navegación inferior en móvil.
- Tarjetas claras.
- Formularios rápidos.
- Botones accesibles.
- Diseño limpio.
- Información visual y directa.

---

## 📁 Estructura del proyecto

```txt
Summer-Stash/
├── app/
│   ├── dashboard/
│   ├── expenses/
│   ├── income/
│   ├── budgets/
│   ├── goals/
│   └── auth/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── forms/
│   └── layout/
│
├── lib/
├── utils/
├── public/
├── package.json
└── README.md