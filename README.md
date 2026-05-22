# ⚡ BlinkChat

BlinkChat is a premium, real-time messaging application designed with modern aesthetics, fast interactions, and security-first features. Built on top of the MERN stack with Socket.io, it offers an immersive chatting experience complete with micro-interactions, dark mode aesthetics, and specialized privacy features.

---

## 🚀 Key Features

### 1. ⚡ Disappearing "Blink" Messages
Send secure, disappearing messages that vanish forever after viewing:
* **Receiver Lock**: Blink messages are secured and hidden behind a lock screen for the receiver.
* **Explicit Reveal**: The receiver must click **Reveal Message** to read the text or view the attachment.
* **Live Countdown**: Revealing starts a live visual timer (customizable 5s or 10s duration).
* **Database Purge**: Once the timer hits `0`, the message is completely deleted from both the database and both users' screens instantly.

### 2. 📨 Seen, Sent, & Pending Ticks
Stay informed about your message delivery status with interactive indicators next to your timestamps:
* **Pending (Spinning Clock)**: Shows a subtle rotating clock indicator during optimistic delivery.
* **Sent (Single Tick)**: Displays a single light-purple checkmark when the message reaches the database.
* **Seen (Double Pink Ticks)**: Upgrades to double neon-pink checkmarks when the receiver reads your message. Hover over the ticks to see the exact read timestamp (*Seen at HH:MM*).

### 3. 😄 Rich Message Reactions
Add instant expressions to any message:
* **Interactive Tooltip**: Hovering over the reactions badge shows a customized list of users who reacted (supports scrolling and interactive pointer events).
* **Details Modal**: Clicking the reactions badge opens an immersive modal displaying full names, profile pictures, and active reactions.
* **Correct Resolving**: Accurately resolves user names by cross-referencing contact profiles.

### 4. 📴 Intelligent Offline Support
Never worry about losing your connection:
* **Visual Alerts**: A pulsing red top banner slides down instantly if your network drops, notifying you that you're offline.
* **UI Safeguards**: Automatically disables message input fields, uploads, and send buttons when offline to prevent silent losses.
* **Recovery Sync**: Reconnects instantly with success toasts once the network is restored.

### 5. 🔄 Message Forwarding
Forward text and media content effortlessly:
* **Contact Search**: Quick filter through contacts using a real-time search bar.
* **Multi-Select Modal**: Select multiple recipients and forward the content in one single click.

### 6. 🗑️ Flexible Deletion
Keep full control over your chat histories:
* **Delete for Myself**: Hides the message from your chat history while preserving it for the receiver.
* **Delete for Everyone**: Completely purges the message from both screens in real-time.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 19, JavaScript (ES6+), Vite
* **State Management**: Zustand
* **Styling**: TailwindCSS, CSS variables, Glassmorphism
* **Icons**: Lucide React
* **Alerts**: React Hot Toast

### Backend
* **Runtime**: Node.js, Express
* **Database**: MongoDB (Mongoose)
* **Real-time communication**: Socket.io (WebSocket)

---

## 📦 Installation & Setup

### Prerequisites
Make sure you have Node.js and MongoDB installed on your system.

### 1. Clone the repository
```bash
git clone https://github.com/Khaviya-Vimalarajan/blinkchat.git
cd blinkchat
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` folder:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 3. Install Dependencies
Install dependencies for both frontend and backend:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Run the Application

#### Run Backend Server:
```bash
cd backend
npm run dev
```

#### Run Frontend Server:
```bash
cd frontend
npm run dev
```

---

## 🎨 Premium Visual System
BlinkChat is built around a curated **Cyber-Purple & Pink** color palette. It employs HSL-tailored colors, dynamic neon gradients, glassmorphism containers, smooth fade-in slide transitions, and micro-animations to deliver a state-of-the-art interactive experience.
