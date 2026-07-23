# Getting Started with SarthakSetu

> A complete, step-by-step guide for absolute beginners.
>
> No prior knowledge of Node.js, PostgreSQL, Docker, Clerk, or pnpm is assumed.
> Follow every numbered step in order. Do not skip steps.

---

## Table of Contents

1. [Before You Begin](#1-before-you-begin)
2. [Install Git](#2-install-git)
3. [Install Node.js](#3-install-nodejs)
4. [Install pnpm](#4-install-pnpm)
5. [Install PostgreSQL](#5-install-postgresql)
6. [Install Docker (Optional)](#6-install-docker-optional)
7. [Create a Clerk Account](#7-create-a-clerk-account)
8. [Download the Project](#8-download-the-project)
9. [Install Project Dependencies](#9-install-project-dependencies)
10. [Create Your Environment File](#10-create-your-environment-file)
11. [Create the Database](#11-create-the-database)
12. [Start the Application](#12-start-the-application)
13. [Log In and Explore](#13-log-in-and-explore)
14. [Run with Docker (Optional)](#14-run-with-docker-optional)
15. [Production Deployment](#15-production-deployment)
16. [Updating the Application](#16-updating-the-application)
17. [Back Up Your Data](#17-back-up-your-data)
18. [Restore from Backup](#18-restore-from-backup)
19. [Troubleshooting](#19-troubleshooting)
20. [Final Checklist](#20-final-checklist)

---

## 1. Before You Begin

### What You Will Do

You are going to install software on your computer, download a project from the internet, configure it, and run a web application. By the end, you will have a working website that connects food donors with NGOs.

### What You Need

- A computer running **Windows 10/11**, **macOS 13+**, or **Linux**
- An internet connection
- About **30 minutes** of uninterrupted time for your first setup
- Administrator access to your computer (you need to install software)

### Overview of the Steps

| Step | What You Will Do |
|------|-----------------|
| 2 | Install Git (to download the project) |
| 3 | Install Node.js (to run the application) |
| 4 | Install pnpm (to manage project packages) |
| 5 | Install PostgreSQL (the database) |
| 6 | Install Docker (optional, alternative to installing PostgreSQL directly) |
| 7 | Create a Clerk account (for user login) |
| 8 | Download the project files |
| 9 | Install the project's internal dependencies |
| 10 | Create a configuration file with your secrets |
| 11 | Create the database tables |
| 12 | Start the application |
| 13 | Create your first account and explore |

> **Tip:** Read through each step completely before running the commands. If a step fails, do not continue to the next step. Fix the problem first.

---

## 2. Install Git

### What Is Git?

Git is a tool that downloads project files from the internet. Think of it like a more advanced "Download" button that also keeps track of versions.

### Step 2.1: Download Git

**Windows:**

1. Open your web browser and go to: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. The download should start automatically.
3. If it does not, click the link that says **"Click here to download manually."**
4. Run the downloaded installer file.
5. During installation, keep the default settings. Click **Next** on every screen until the installation finishes.

**macOS:**

1. Open the **Terminal** app (press `Cmd + Space`, type "Terminal", press Enter).
2. Run this command:
   ```bash
   git --version
   ```
3. If Git is not installed, a popup will appear asking if you want to install developer tools. Click **Install**.
4. Wait for the installation to complete.

**Linux (Ubuntu / Debian):**

1. Open a terminal.
2. Run:
   ```bash
   sudo apt-get update
   sudo apt-get install git
   ```
3. When prompted for your password, type it and press Enter. (The password will not show on screen as you type. This is normal.)

**Linux (Fedora):**

```bash
sudo dnf install git
```

**Linux (Arch):**

```bash
sudo pacman -S git
```

### Step 2.2: Verify Git Is Installed

Open a terminal (or command prompt on Windows) and run:

```bash
git --version
```

**Expected output:**

```
git version 2.48.0
```

(Your version number may be different. Any version 2.x or higher is fine.)

**How to know it succeeded:** You see a version number printed.

**If it fails:** Close your terminal, open a new one, and try again. On Windows, you may need to restart your computer after installing Git.

---

## 3. Install Node.js

### What Is Node.js?

Node.js is the engine that runs the application's backend code. It is like the operating system for JavaScript programs that run on a server.

### Step 3.1: Download Node.js

1. Open your web browser and go to: [https://nodejs.org](https://nodejs.org)
2. You will see two big green buttons:
   - **LTS** (Long Term Support) — this is the stable version
   - **Current** — this is the newest version
3. Click the **LTS** button to download.

**Insert screenshot here showing the Node.js homepage with the LTS download button highlighted.**

### Step 3.2: Install Node.js

**Windows:**

1. Run the downloaded `.msi` installer.
2. Click **Next** through the setup wizard.
3. On the "Tools for Native Modules" screen, click the checkbox to install it (this helps with some dependencies).
4. Click **Install**.
5. Click **Finish**.

**macOS:**

1. Run the downloaded `.pkg` installer.
2. Click **Continue** through the setup wizard.
3. Click **Install**.
4. Enter your computer password when asked.
5. Click **Close**.

**Linux:**

Use the NodeSource repository for the latest version:

**Ubuntu / Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora:**

```bash
curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -
sudo dnf install -y nodejs
```

### Step 3.3: Verify Node.js Is Installed

Open a terminal and run:

```bash
node --version
```

**Expected output:**

```
v24.13.0
```

(Any version 20 or higher is acceptable. 24 is recommended.)

**Also verify npm (it comes with Node.js):**

```bash
npm --version
```

**Expected output:**

```
11.6.2
```

(Any version 10 or higher is fine.)

**How to know it succeeded:** Both commands print version numbers.

**If it fails:** On Windows, open a new command prompt after installation. On macOS, open a new Terminal window. On Linux, run `source ~/.bashrc` and try again.

---

## 4. Install pnpm

### What Is pnpm?

pnpm is a tool that downloads and manages the small building blocks (called "packages") that this project needs to run. This project **requires** pnpm. It will not work with npm or yarn.

### Step 4.1: Install pnpm

Open a terminal and run this exact command:

```bash
npm install -g pnpm
```

**What this does:** Uses npm (which came with Node.js) to install pnpm globally on your computer.

**Why this is needed:** The project has a safety check that prevents installation with npm or yarn.

**How long it takes:** 10–30 seconds.

**Expected output:**

```
added 1 package in 12s
```

### Step 4.2: Verify pnpm Is Installed

Run:

```bash
pnpm --version
```

**Expected output:**

```
10.26.1
```

(Any version 9 or higher is fine.)

**How to know it succeeded:** A version number is printed.

**If it fails:** Try running the install command again. If it still fails, visit [https://pnpm.io/installation](https://pnpm.io/installation) for alternative installation methods.

---

## 5. Install PostgreSQL

### What Is PostgreSQL?

PostgreSQL is the database where all user accounts, food donations, claims, and statistics are stored. Think of it as a filing cabinet that the application reads from and writes to.

You have two options:

- **Option A: Docker PostgreSQL** (easiest, works on every OS)
- **Option B: Native PostgreSQL** (installs directly on your computer)

If you already installed Docker in Step 6, use **Option A**. Otherwise, choose the option that matches your operating system below.

### Option A: Docker PostgreSQL (Recommended for Beginners)

This is the easiest way. You only need Docker installed (see Step 6).

1. Open a terminal.
2. Run this command. It downloads and starts PostgreSQL:

```bash
docker run -d \
  --name sarthaksetu-postgres \
  -e POSTGRES_USER=sarthaksetu \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=sarthaksetu \
  -p 5432:5432 \
  postgres:16-alpine
```

**What this does:**
- `-d` — runs in the background
- `--name` — names the container
- `-e` — sets environment variables (username, password, database name)
- `-p 5432:5432` — makes the database available on port 5432
- `postgres:16-alpine` — uses the official PostgreSQL 16 image

**How long it takes:** 1–3 minutes on first run (downloads the image).

**Expected output:**

```
Unable to find image 'postgres:16-alpine' locally
16-alpine: Pulling from library/postgres
...
Status: Downloaded newer image for postgres:16-alpine
a1b2c3d4e5f6...
```

The long random string at the end is the container ID. This means it worked.

3. Verify the container is running:

```bash
docker ps
```

**Expected output:**

```
CONTAINER ID   IMAGE                STATUS          PORTS
a1b2c3d4e5f6   postgres:16-alpine   Up 10 seconds   0.0.0.0:5432->5432/tcp
```

**How to know it succeeded:** You see `sarthaksetu-postgres` in the list with status `Up`.

**Your database connection string for Step 10 will be:**

```
DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
```

**Skip to Step 7** (Clerk setup). You do not need Option B.

### Option B: Native PostgreSQL Installation

Choose your operating system:

#### B1: macOS (Homebrew)

**Step B1.1: Install Homebrew**

If you do not have Homebrew, install it:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen instructions. When it finishes, run the command it tells you to add Homebrew to your PATH (usually `eval $(/opt/homebrew/bin/brew shellenv)`).

**Step B1.2: Install PostgreSQL**

```bash
brew install postgresql@16
```

**Step B1.3: Start PostgreSQL**

```bash
brew services start postgresql@16
```

**Step B1.4: Create the Database**

```bash
createdb sarthaksetu
```

**Step B1.5: Verify**

```bash
psql -d sarthaksetu -c "SELECT version();"
```

**Expected output:**

```
                                                version
---------------------------------------------------------------------------------------------------------
 PostgreSQL 16.4 on aarch64-apple-darwin23.6.0, compiled by Apple clang version 15.0.0, 64-bit
(1 row)
```

**Your database connection string for Step 10 will be:**

```
DATABASE_URL=postgres://$(whoami)@localhost:5432/sarthaksetu
```

On macOS with Homebrew, your macOS username is the database user, and no password is required for local connections.

#### B2: Ubuntu / Debian

**Step B2.1: Install PostgreSQL**

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

**Step B2.2: Start the Service**

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Step B2.3: Create the Database**

```bash
sudo -u postgres createdb sarthaksetu
```

**Step B2.4: Create a Dedicated User (Recommended)**

```bash
sudo -u postgres psql -c "CREATE USER sarthaksetu WITH PASSWORD 'changeme';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO sarthaksetu;"
```

**Step B2.5: Verify**

```bash
sudo -u postgres psql -d sarthaksetu -c "SELECT version();"
```

**Expected output:**

```
                                                      version
-------------------------------------------------------------------------------------------------------------------
 PostgreSQL 16.4 (Ubuntu 16.4-1.pgdg24.04+1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2) 13.3.0, 64-bit
(1 row)
```

**Your database connection string for Step 10 will be:**

```
DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
```

#### B3: Fedora

```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres createdb sarthaksetu
sudo -u postgres psql -c "CREATE USER sarthaksetu WITH PASSWORD 'changeme';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO sarthaksetu;"
```

**Your database connection string for Step 10:**

```
DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
```

#### B4: Windows

**Step B4.1: Download the Installer**

1. Go to: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Click the link for the **Interactive installer by EDB**.
3. Download version 16.x.

**Insert screenshot here showing the PostgreSQL download page.**

**Step B4.2: Run the Installer**

1. Run the downloaded `.exe` file.
2. Click **Next**.
3. Keep the default installation directory. Click **Next**.
4. Keep all components selected. Click **Next**.
5. On the "Data Directory" screen, keep the default. Click **Next**.
6. **Important:** On the "Password" screen, enter a password and write it down. You will need it later. Click **Next**.
7. Keep the default port `5432`. Click **Next**.
8. Keep the default locale. Click **Next**.
9. Click **Next** until installation begins.
10. Wait for installation to complete.
11. Uncheck "Stack Builder" when it appears. Click **Finish**.

**Step B4.3: Open pgAdmin and Create the Database**

1. Open the **Start Menu** and search for "pgAdmin".
2. Open **pgAdmin 4**.
3. It will open in your browser. Enter the master password you set during installation.
4. In the left panel, expand **Servers** → **PostgreSQL 16** → **Databases**.
5. Right-click **Databases** → **Create** → **Database...**
6. In the "Database" field, enter: `sarthaksetu`
7. Click **Save**.

**Insert screenshot here showing pgAdmin with the new database created.**

**Your database connection string for Step 10 will be:**

```
DATABASE_URL=postgres://postgres:your_password@localhost:5432/sarthaksetu
```

Replace `your_password` with the password you wrote down during installation.

---

## 6. Install Docker (Optional)

### What Is Docker?

Docker is a tool that runs software inside isolated containers. It simplifies installation because everything comes pre-packaged. If you used Option A in Step 5, you already need Docker.

### When Do You Need Docker?

- **Yes, install Docker** if you want the easiest PostgreSQL setup (Option A in Step 5) or if you want to run the entire application with `docker compose up`.
- **No, skip Docker** if you installed PostgreSQL directly (Option B in Step 5) and you plan to run the application with `pnpm dev`.

### Step 6.1: Install Docker

**Windows:**

1. Go to: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Click **Download Docker Desktop**.
3. Run the installer.
4. During installation, keep the default settings.
5. If prompted to enable WSL2, click **Yes** and follow the instructions.
6. After installation, open Docker Desktop from the Start Menu.
7. Wait for the whale icon in the system tray to stop moving. This means Docker is ready.

**Insert screenshot here showing Docker Desktop running.**

**macOS:**

1. Go to: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Click **Download Docker Desktop for Mac (Apple Silicon)** or **(Intel)** depending on your Mac.
3. Open the downloaded `.dmg` file.
4. Drag the Docker icon to the Applications folder.
5. Open Docker Desktop from Applications.
6. Wait for the "Docker Desktop is running" message.

**Linux (Ubuntu / Debian):**

```bash
# Add Docker's official GPG key
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow your user to run Docker without sudo
sudo usermod -aG docker $USER
```

**Log out and log back in** after running the last command. This is required for the group change to take effect.

### Step 6.2: Verify Docker Is Installed

```bash
docker --version
docker compose version
```

**Expected output:**

```
Docker version 27.5.1, build v27.5.1
Docker Compose version v2.32.4
```

(Your version numbers may differ. Any recent version is fine.)

**How to know it succeeded:** Both commands print version numbers without errors.

**If it fails on Linux:** Make sure you logged out and back in after `usermod`. If it still fails, try `sudo docker --version`.

---

## 7. Create a Clerk Account

### What Is Clerk?

Clerk is a service that handles user authentication — sign-up, sign-in, password reset, email verification. Instead of building all of this yourself, you connect to Clerk and it provides a login box for your application.

### Step 7.1: Create an Account

1. Open your web browser and go to: [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Click **Sign Up**.
3. Enter your email address.
4. Create a password.
5. Click **Continue**.
6. Check your email inbox for a verification code.
7. Enter the code on the Clerk website.
8. Click **Verify**.

**Insert screenshot here showing the Clerk sign-up page.**

### Step 7.2: Create an Application

1. After signing in, you will see a page that says "Create your first application."
2. Click the **Create Application** button.
3. Enter a name: `SarthakSetu`
4. Under "How will your users sign in?" select:
   - **Email** (checked by default)
   - **Password** (checked by default)
   - You can leave the others unchecked for now.
5. Click **Create application**.

**Insert screenshot here showing the Clerk "Create Application" form.**

### Step 7.3: Get Your API Keys

1. In the left sidebar of the Clerk Dashboard, click **Configure**.
2. Click **API Keys**.
3. You will see two important keys:
   - **Publishable key** — starts with `pk_test_`
   - **Secret key** — starts with `sk_test_`

**Insert screenshot here showing the Clerk API Keys page with both keys visible.**

4. **Copy the Publishable key.** Click the copy button next to it. Paste it into a temporary text file on your computer.
5. **Copy the Secret key.** Click the copy button next to it. Paste it into the same text file.

> **Important:** These are like passwords. Do not share them. Do not commit them to Git.

### Step 7.4: Configure Redirect URLs

1. In the left sidebar, click **Configure** → **URLs & redirects**.
2. Under **Redirect URLs**, add:
   ```
   http://localhost:5173/
   ```
3. Under **Allowed origins**, add:
   ```
   http://localhost:5173
   http://localhost:8080
   ```
4. Click **Save changes**.

**Insert screenshot here showing the URLs & redirects configuration.**

### Step 7.5: Keep Your Keys Safe

Leave your text file with the keys open. You will need to paste them in Step 10.

**How to know it succeeded:** You have a text file containing two keys: one starting with `pk_test_` and one starting with `sk_test_`.

---

## 8. Download the Project

### Step 8.1: Choose a Folder

Decide where on your computer you want to store the project. A good location:

- **Windows:** `C:\Users\YourName\Projects\`
- **macOS:** `/Users/YourName/Projects/`
- **Linux:** `/home/yourname/Projects/`

Create the `Projects` folder if it does not exist.

### Step 8.2: Clone the Repository

Open a terminal (or command prompt on Windows). Navigate to your Projects folder:

**Windows:**

```bash
cd C:\Users\YourName\Projects
```

**macOS / Linux:**

```bash
cd ~/Projects
```

Then run:

```bash
git clone https://github.com/your-org/sarthaksetu.git
```

**What this does:** Downloads all project files into a new folder called `sarthaksetu`.

**How long it takes:** 10–60 seconds depending on your internet speed.

**Expected output:**

```
Cloning into 'sarthaksetu'...
remote: Enumerating objects: 2847, done.
remote: Counting objects: 100% (2847/2847), done.
remote: Compressing objects: 100% (1203/1203), done.
remote: Total 2847 (delta 1521), reused 2700 (delta 1400), pack-reused 0
Receiving objects: 100% (2847/2847), 12.45 MiB | 5.20 MiB/s, done.
Resolving deltas: 100% (1521/1521), done.
```

### Step 8.3: Enter the Project Folder

```bash
cd sarthaksetu
```

**How to know it succeeded:** Your terminal prompt now shows `sarthaksetu` in the path. Run `ls` (or `dir` on Windows) to see the project files.

**If it fails:** Make sure Git is installed (Step 2). Check that the URL is correct.

### Alternative: Download as ZIP

If you cannot use Git:

1. Go to the project page on GitHub.
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Extract the ZIP file to your Projects folder.
5. Rename the extracted folder to `sarthaksetu`.

---

## 9. Install Project Dependencies

### What Are Dependencies?

The project is built on top of many smaller packages written by other people — React, Express, database drivers, authentication libraries, and so on. These are called "dependencies." This step downloads all of them.

### Step 9.1: Run the Install Command

Make sure you are inside the `sarthaksetu` folder (your terminal should show `sarthaksetu` somewhere in the path).

Run:

```bash
pnpm install
```

**What this does:**
- Reads the list of required packages from the project files
- Downloads each package from the internet
- Organizes them in a special folder called `node_modules`
- Creates/updates a lock file to ensure consistency

**How long it takes:** 2–10 minutes on first run. It downloads several hundred packages.

**Expected output:**

```
Scope: all 7 workspace projects
Progress: resolved 524, reused 0, downloaded 524, added 524
Done in 45.2s
```

**What you will see:**
- A progress bar showing packages being downloaded
- Various post-install messages from packages
- A final "Done" message

### Step 9.2: Verify the Doctor Tool

The project includes a diagnostic tool. Run it to check that everything is ready:

```bash
pnpm doctor
```

**Expected output:**

```
Node.js
  ✓ Node v24.13.0 (required >= 20)

Package Manager
  ✓ pnpm 10.26.1 (required >= 9)

Environment Variables
  ⚠ .env file missing — copy from .env.example: cp .env.example .env
  ✓ DATABASE_URL is set
  ...

PostgreSQL
  ✓ PostgreSQL reachable at localhost:5432

Dependencies
  ✓ node_modules exists
  ✓ react @ 19.1.0
  ✓ express @ 5.2.1
  ...

Build Status
  ✓ Backend built (dist/index.mjs)
  ✓ Frontend built (dist/public/index.html)
```

**How to know it succeeded:** Most checks show green checkmarks (✓). A yellow warning (⚠) about `.env file missing` is expected — you will fix this in Step 10.

**If it fails:**
- "node_modules missing" → Run `pnpm install` again.
- "PostgreSQL not reachable" → Make sure PostgreSQL is running (Step 5).
- Any dependency check fails → Run `pnpm install` again.

---

## 10. Create Your Environment File

### What Is an Environment File?

The `.env` file contains secret configuration values — database passwords, API keys — that the application needs but that should never be shared publicly. This file is not committed to Git.

### Step 10.1: Copy the Template

Inside the `sarthaksetu` folder, run:

```bash
cp .env.example .env
```

**What this does:** Creates a new file called `.env` with the same content as `.env.example`.

### Step 10.2: Open the File for Editing

**Windows:**

```bash
notepad .env
```

**macOS:**

```bash
open -e .env
```

**Linux:**

```bash
nano .env
```

(Or use your preferred text editor: VS Code, Vim, etc.)

### Step 10.3: Fill in the Required Values

The `.env` file will look like this:

```
# SarthakSetu — Development Environment Variables

NODE_ENV=development
PORT=8080
FRONTEND_PORT=5173
BASE_PATH=/

# ---------------------------------------------------------------------------
# DATABASE
# ---------------------------------------------------------------------------
DATABASE_URL=postgres://user:password@localhost:5432/sarthaksetu

# ---------------------------------------------------------------------------
# CLERK AUTHENTICATION
# ---------------------------------------------------------------------------
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

VITE_CLERK_PROXY_URL=
LOG_LEVEL=info
```

#### Variable 1: DATABASE_URL

Replace `user:password` with your actual PostgreSQL username and password.

- **If you used Docker (Option A):**
  ```
  DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
  ```

- **If you used macOS Homebrew (Option B1):**
  ```
  DATABASE_URL=postgres://your_mac_username@localhost:5432/sarthaksetu
  ```
  Replace `your_mac_username` with your actual macOS username (run `whoami` in a terminal to see it).

- **If you used Ubuntu/Debian (Option B2):**
  ```
  DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
  ```

- **If you used Windows (Option B4):**
  ```
  DATABASE_URL=postgres://postgres:your_password@localhost:5432/sarthaksetu
  ```
  Replace `your_password` with the password you set during PostgreSQL installation.

#### Variable 2: CLERK_PUBLISHABLE_KEY

Replace `pk_test_your_key_here` with the **Publishable key** you copied from Clerk in Step 7.

It should look like:
```
CLERK_PUBLISHABLE_KEY=pk_test_abc123def456ghi789
```

#### Variable 3: CLERK_SECRET_KEY

Replace `sk_test_your_key_here` with the **Secret key** you copied from Clerk in Step 7.

It should look like:
```
CLERK_SECRET_KEY=sk_test_xyz789uvw456rst123
```

#### Variable 4: VITE_CLERK_PUBLISHABLE_KEY

This is the **same value** as `CLERK_PUBLISHABLE_KEY`. Copy and paste the same key:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_abc123def456ghi789
```

> **Why two keys?** `CLERK_PUBLISHABLE_KEY` is read by the backend. `VITE_CLERK_PUBLISHABLE_KEY` is read by the frontend build tool (Vite). They must be identical.

#### Other Variables

Leave the rest as they are for now:

| Variable | Leave As | Why |
|----------|---------|-----|
| `NODE_ENV` | `development` | Tells the app to run in development mode |
| `PORT` | `8080` | The backend API will run on port 8080 |
| `FRONTEND_PORT` | `5173` | The frontend dev server will run on port 5173 |
| `BASE_PATH` | `/` | The app is served from the root URL |
| `VITE_CLERK_PROXY_URL` | *(empty)* | Only needed for custom domains |
| `LOG_LEVEL` | `info` | How much logging to show |

### Step 10.4: Save and Close

- **Notepad:** Press `Ctrl + S`, then close the window.
- **nano:** Press `Ctrl + O`, then `Enter`, then `Ctrl + X`.
- **VS Code:** Press `Ctrl + S`.

### Step 10.5: Verify

Run:

```bash
pnpm doctor
```

**Expected output:** The yellow warning about `.env file missing` should now be gone. All checks should show green checkmarks (✓).

**How to know it succeeded:** No warnings about missing environment variables.

**If it fails:**
- "DATABASE_URL not set" → You did not save the `.env` file correctly. Open it again and make sure the changes are saved.
- "CLERK_PUBLISHABLE_KEY not set" → Make sure you replaced the placeholder values with real keys.

---

## 11. Create the Database

### What Is Happening?

The project defines what tables the database needs (users, donations, claims, etc.) in code files. This step tells the database to create those tables.

### Step 11.1: Push the Database Schema

Inside the `sarthaksetu` folder, run:

```bash
pnpm db:push
```

**What this does:**
- Reads the table definitions from the project code
- Connects to PostgreSQL using your `DATABASE_URL`
- Creates tables, columns, indexes, and data types
- Seeds initial verification data (sample FSSAI licenses, DARPAN IDs, admin codes)

**How long it takes:** 5–15 seconds.

**Expected output:**

```
> @workspace/db@0.0.0 push
> drizzle-kit push --config ./drizzle.config.ts

Using 'pg' driver for database querying
[✓] Pulling schema from database...
[✓] Changes applied
```

You may also see:

```
[17:30:18.515] INFO: Server listening
[17:30:18.891] INFO: request completed
```

This happens because the database push sometimes triggers the API server to start briefly. This is normal.

### Step 11.2: Verify the Database

Run:

```bash
pnpm doctor
```

**Expected output:**

```
PostgreSQL
  ✓ PostgreSQL reachable at localhost:5432

Build Status
  ✓ Backend built (dist/index.mjs)
```

**How to know it succeeded:** `pnpm doctor` shows all green. The database schema has been created.

**If it fails:**
- "Connection refused" → PostgreSQL is not running. Go back to Step 5 and start it.
- "password authentication failed" → Your `DATABASE_URL` password is wrong. Check Step 10.
- "database does not exist" → You did not create the `sarthaksetu` database. Go back to Step 5.

---

## 12. Start the Application

### Step 12.1: Start Both Services

Inside the `sarthaksetu` folder, run:

```bash
pnpm dev
```

**What this does:**
- Starts the backend API server (Express) on port 8080
- Starts the frontend development server (Vite) on port 5173
- Both run in the same terminal with color-coded output

**How long it takes:** 10–30 seconds on first start.

**Expected terminal output:**

```
> workspace@0.0.0 dev
> concurrently --names "API,FE" --prefix-colors cyan,magenta "pnpm --filter @workspace/api-server run dev" "pnpm --filter @workspace/annsetu run dev"

[API] > @workspace/api-server@0.0.0 dev
[API] > export NODE_ENV=development && pnpm run build && pnpm run start
[API] ⚡ Done in 1987ms
[API] [17:30:18.515] INFO: Server listening
[API]     port: 8080

[FE] > @workspace/annsetu@0.0.0 dev
[FE] > vite --config vite.config.ts --host 0.0.0.0
[FE]   VITE v7.3.3  ready in 647 ms
[FE]   ➤  Local:   http://localhost:5173/
[FE]   ➤  Network: http://192.168.1.42:5173/
```

**Insert screenshot here showing the terminal with both services running.**

### Step 12.2: Open the Frontend

Open your web browser and go to:

```
http://localhost:5173
```

**What you should see:**

The SarthakSetu homepage with:
- The orange logo "SarthakSetu" in the top-left corner
- "Home", "Sign In", and "Sign Up" buttons in the top-right
- A large heading: "Share food. Spread hope."
- A description and two buttons: "Join the Mission" and "Sign In"

**Insert screenshot here showing the SarthakSetu homepage loaded in the browser.**

### Step 12.3: Verify the Backend

Open a new browser tab and go to:

```
http://localhost:8080/api/healthz
```

**What you should see:**

```json
{"status":"ok"}
```

This is the API health check. It confirms the backend is running and can respond to requests.

### Step 12.4: Verify Platform Stats

Go to:

```
http://localhost:8080/api/stats/platform
```

**What you should see:**

```json
{"totalDonors":0,"totalNgos":0,"totalDonations":0,"totalPlatesSaved":0,"activeDonations":0}
```

These are public statistics. The zeros are expected because no users or donations exist yet.

### What the URLs Mean

| URL | What It Is |
|-----|-----------|
| `http://localhost:5173` | The frontend website (what users see) |
| `http://localhost:8080/api/healthz` | Backend health check |
| `http://localhost:8080/api/stats/platform` | Public statistics |

**How to know it succeeded:** You see the homepage in the browser, and the health endpoint returns `{"status":"ok"}`.

**If it fails:**
- "This site can't be reached" → The servers did not start. Check the terminal for error messages.
- "Connection refused" → A firewall may be blocking ports 5173 or 8080. Check your firewall settings.
- Blank page → Open the browser's developer console (F12 → Console) and check for red error messages.

---

## 13. Log In and Explore

### Step 13.1: Create Your First Account

1. On the SarthakSetu homepage, click the **Sign Up** button in the top-right corner.
2. A Clerk sign-up modal will appear.
3. Enter your email address.
4. Enter a password (at least 8 characters).
5. Click **Continue**.
6. Check your email for a verification code.
7. Enter the code in the modal.
8. Click **Verify**.

**Insert screenshot here showing the Clerk sign-up modal.**

### Step 13.2: Complete Onboarding

After signing up, the app will ask you to complete your profile:

1. Choose your role: **Donor** or **NGO/Volunteer**.
2. Fill in your name, phone number, and address.
3. If you chose **Donor**, select your category (Restaurant, Hotel, Caterer, Event Organizer, or Household).
4. If you chose **NGO/Volunteer**, enter your organization name and registration number.
5. Click **Save**.

### Step 13.3: Explore as a Donor

If you registered as a donor:

1. Click **"List a Donation"** on the dashboard.
2. Fill in the form:
   - Food type (e.g., "Rice and Dal")
   - Quantity (number of plates)
   - Preparation time
   - Pickup deadline
   - Upload a photo (optional)
3. Click **Submit**.
4. Your donation now appears on the interactive map.

### Step 13.4: Explore as an NGO

If you registered as an NGO:

1. Click **"Find Donations"** on the dashboard.
2. You will see an interactive map with color-coded markers.
3. Click on a marker to see donation details.
4. Click **"Claim"** to claim a donation.
5. A 6-digit OTP will be generated.
6. At pickup time, the donor will give you the OTP.
7. Enter the OTP in the app to mark the donation as **Completed**.

### Step 13.5: View the Map

Click **"Map"** in the navigation bar to see all donations on an interactive map of India.

- Green markers = Household donations
- Yellow markers = Restaurant donations
- Orange markers = Caterer / Event Organizer donations
- Red markers = Urgent donations (near deadline)

**Insert screenshot here showing the interactive map with donation markers.**

---

## 14. Run with Docker (Optional)

This is an alternative way to run the application. If you already have it running with `pnpm dev`, you can skip this section.

### When to Use Docker

Use Docker if you want:
- A completely isolated environment (no need to install Node.js or PostgreSQL directly)
- An easy way to run everything with one command
- A setup that is identical on every computer

### Step 14.1: Configure Environment

1. Make sure Docker is installed (Step 6).
2. Make sure you have completed Step 10 (`.env` file with Clerk keys).
3. Copy the production example:
   ```bash
   cp .env.production.example .env
   ```
4. Edit `.env` and replace all `pk_live_your_key_here` and `sk_live_your_key_here` placeholders with your actual Clerk keys.
   - **Important:** Use the same keys you used in development. For local Docker testing, development keys (`pk_test_`) are fine.
5. Make sure the database URL in `.env` uses the internal Docker hostname:
   ```
   DATABASE_URL=postgres://sarthaksetu:changeme@postgres:5432/sarthaksetu
   ```

### Step 14.2: Build and Start

Run:

```bash
docker compose up -d
```

**What this does:**
- `-d` — runs in the background (detached mode)
- Downloads the PostgreSQL 16 image
- Builds the API server from the Dockerfile
- Downloads the nginx image
- Starts all three services

**How long it takes:** 3–10 minutes on first run.

**Expected output:**

```
[+] Running 4/4
 ✐ Network sarthaksetu_sarthaksetu-net    Created
 ✐ Volume "sarthaksetu_postgres-data"     Created
 ✐ Container sarthaksetu-postgres         Started
 ✐ Container sarthaksetu-api              Started
 ✐ Container sarthaksetu-nginx            Started
```

### Step 14.3: Verify Docker Is Running

```bash
docker compose ps
```

**Expected output:**

```
NAME                  IMAGE                STATUS          PORTS
sarthaksetu-api       sarthaksetu-api      Up 30 seconds   0.0.0.0:8080->8080/tcp
sarthaksetu-nginx     nginx:alpine         Up 30 seconds   0.0.0.0:80->80/tcp
sarthaksetu-postgres  postgres:16-alpine   Up 30 seconds   0.0.0.0:5432->5432/tcp
```

All three containers should show status `Up`.

### Step 14.4: Open the Application

Open your browser and go to:

```
http://localhost
```

**Why port 80?** nginx listens on port 80 and serves the frontend + proxies API requests.

### Step 14.5: View Logs

```bash
docker compose logs -f api
```

**What this does:** Shows the API server logs in real time. Press `Ctrl + C` to stop watching.

### Step 14.6: Stop Docker

```bash
docker compose down
```

**What this does:** Stops and removes all containers. Your database data is preserved in the Docker volume.

To also delete all data (including the database):

```bash
docker compose down -v
```

### Docker Command Reference

| Command | What It Does |
|---------|-------------|
| `docker compose up -d` | Start all services in the background |
| `docker compose down` | Stop all services (keeps data) |
| `docker compose down -v` | Stop and delete all data |
| `docker compose ps` | Show running containers |
| `docker compose logs -f api` | Watch API logs |
| `docker compose logs -f postgres` | Watch database logs |
| `docker compose logs -f nginx` | Watch nginx logs |
| `docker compose build --no-cache` | Rebuild after code changes |
| `docker compose restart api` | Restart just the API |

---

## 15. Production Deployment

This section covers deploying the application on a server that is accessible on the internet.

### Before You Deploy

**Important:** Before deploying to production:

1. Switch to **Production** Clerk keys:
   - In the Clerk Dashboard, create a **Production** instance.
   - Copy the `pk_live_...` and `sk_live_...` keys.
   - Update your `.env` file with these keys.
2. Set `NODE_ENV=production`.
3. Use a strong PostgreSQL password.
4. Enable HTTPS with a valid SSL certificate.
5. Never expose port 8080 or 5432 directly to the internet. Use nginx as a reverse proxy.

### Option A: Ubuntu VPS (Most Common)

This is the standard way to deploy on a Virtual Private Server (VPS) from providers like DigitalOcean, Hetzner, AWS, Linode, etc.

#### Prerequisites

- A VPS with Ubuntu 24.04 LTS
- Root or sudo access
- A domain name pointed to your server's IP address

#### Step-by-Step

**1. Update the system:**

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

**2. Install Node.js 24:**

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**3. Install pnpm:**

```bash
sudo npm install -g pnpm
```

**4. Install PostgreSQL:**

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres createdb sarthaksetu
sudo -u postgres psql -c "CREATE USER sarthaksetu WITH PASSWORD 'strong_password_here';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO sarthaksetu;"
```

**5. Install nginx:**

```bash
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**6. Clone the project:**

```bash
cd /var/www
sudo git clone https://github.com/your-org/sarthaksetu.git
sudo chown -R $USER:$USER sarthaksetu
cd sarthaksetu
```

**7. Install dependencies and build:**

```bash
pnpm install
pnpm db:push
pnpm build
```

**8. Configure the environment:**

```bash
cp .env.production.example .env
```

Edit `.env` with production values:
- `NODE_ENV=production`
- `DATABASE_URL=postgres://sarthaksetu:strong_password_here@localhost:5432/sarthaksetu`
- `CLERK_PUBLISHABLE_KEY=pk_live_your_key`
- `CLERK_SECRET_KEY=sk_live_your_key`
- `VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key`

**9. Configure nginx:**

```bash
sudo cp nginx.conf /etc/nginx/sites-available/sarthaksetu
sudo ln -sf /etc/nginx/sites-available/sarthaksetu /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Edit the copied config to update the frontend path:

```bash
sudo nano /etc/nginx/sites-available/sarthaksetu
```

Change:
```
root /usr/share/nginx/html;
```

To:
```
root /var/www/sarthaksetu/artifacts/annsetu/dist/public;
```

Save and exit. Test the config:

```bash
sudo nginx -t
```

Reload nginx:

```bash
sudo systemctl reload nginx
```

**10. Start the API server with PM2:**

```bash
sudo npm install -g pm2
pm2 start "pnpm start" --name sarthaksetu-api
pm2 save
pm2 startup
```

**11. Enable HTTPS with Let's Encrypt:**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically configure SSL in nginx.

**12. Verify:**

Open `https://yourdomain.com` in your browser. You should see the SarthakSetu homepage.

### Option B: Docker on a VPS

If you prefer Docker on your VPS:

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sudo sh

# 2. Clone the project
cd /var/www
git clone https://github.com/your-org/sarthaksetu.git
cd sarthaksetu

# 3. Configure environment
cp .env.production.example .env
# Edit .env with production Clerk keys

# 4. Build and start
docker compose up -d

# 5. Verify
docker compose ps
```

### Option C: Windows Server

1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Install pnpm: `npm install -g pnpm`
3. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
4. Clone the project with Git
5. Follow Steps 9–12 from this guide
6. Use IIS or nginx for Windows as the reverse proxy
7. Use [WinAcme](https://www.win-acme.com/) for Let's Encrypt SSL

### Option D: Home Server

For a Raspberry Pi or home Linux server:

1. Follow the Ubuntu VPS steps above
2. For external access without port forwarding, use a tunnel:

```bash
# Cloudflare Tunnel (free)
npx cloudflared tunnel --url http://localhost:80

# ngrok (free tier)
npx ngrok http 80
```

---

## 16. Updating the Application

When a new version of the project is released, update your local copy safely.

### Step 16.1: Pull Latest Code

```bash
cd ~/Projects/sarthaksetu
git pull
```

**What this does:** Downloads the latest changes from the remote repository.

### Step 16.2: Install Any New Dependencies

```bash
pnpm install
```

**What this does:** If new packages were added, this installs them.

### Step 16.3: Regenerate API Clients (If Needed)

If the OpenAPI spec (`lib/api-spec/openapi.yaml`) was modified:

```bash
pnpm codegen
```

### Step 16.4: Rebuild

```bash
pnpm build
```

### Step 16.5: Restart

If running with `pnpm dev`:
- Press `Ctrl + C` in the terminal to stop
- Run `pnpm dev` again

If running with PM2 on a server:

```bash
pm2 restart sarthaksetu-api
```

If running with Docker:

```bash
docker compose build --no-cache
docker compose up -d
```

---

## 17. Back Up Your Data

### Back Up the PostgreSQL Database

**While the application is running:**

```bash
pg_dump -U sarthaksetu sarthaksetu > backup_$(date +%Y%m%d_%H%M%S).sql
```

**What this does:** Creates a SQL file containing all your data.

**If using Docker:**

```bash
docker compose exec postgres pg_dump -U sarthaksetu sarthaksetu > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Windows (without WSL):**

1. Open pgAdmin.
2. Right-click the `sarthaksetu` database.
3. Click **Backup...**
4. Choose a filename and location.
5. Click **Backup**.

### Back Up Environment Variables

Your `.env` file contains secrets. Keep a copy in a secure location:

```bash
cp .env .env.backup_$(date +%Y%m%d)
```

### Back Up Uploaded Files

If users upload donation photos, back up the upload directory. The default location depends on your configuration.

### Automated Backups (Linux Server)

Create a daily backup script at `/usr/local/bin/backup-sarthaksetu.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/sarthaksetu
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U sarthaksetu sarthaksetu > $BACKUP_DIR/db_$DATE.sql

# Backup .env
cp /var/www/sarthaksetu/.env $BACKUP_DIR/env_$DATE

# Keep only the last 7 backups
ls -t $BACKUP_DIR/db_*.sql | tail -n +8 | xargs rm -f
ls -t $BACKUP_DIR/env_* | tail -n +8 | xargs rm -f
```

Make it executable:

```bash
sudo chmod +x /usr/local/bin/backup-sarthaksetu.sh
```

Add to cron (daily at 3 AM):

```bash
crontab -e
```

Add this line:

```
0 3 * * * /usr/local/bin/backup-sarthaksetu.sh
```

---

## 18. Restore from Backup

### Restore Database

```bash
# Drop and recreate the database (optional, but ensures clean state)
dropdb -U sarthaksetu sarthaksetu
createdb -U sarthaksetu sarthaksetu

# Restore from backup
psql -U sarthaksetu sarthaksetu < backup_20260723_120000.sql
```

**What this does:** Recreates all tables and data from the backup file.

**If using Docker:**

```bash
docker compose exec -T postgres psql -U sarthaksetu sarthaksetu < backup_20260723_120000.sql
```

### Restore Environment Variables

```bash
cp .env.backup_20260723 .env
```

---

## 19. Troubleshooting

### Installation Issues

#### "pnpm install" says "Use pnpm instead"

**Problem:** You are trying to install with npm instead of pnpm.

**Cause:** You ran `npm install` instead of `pnpm install`.

**Solution:**

```bash
pnpm install
```

**Expected result:** Installation proceeds normally.

---

#### "git is not recognized"

**Problem:** Git is not installed or not in your system PATH.

**Cause:** Git installation was incomplete or the terminal was opened before Git finished installing.

**Solution:**

1. Make sure Git is installed (Step 2).
2. On Windows, restart your computer.
3. Open a new terminal and try again.

**Expected result:** `git --version` prints a version number.

---

### Environment Variable Issues

#### "DATABASE_URL must be set"

**Problem:** The application cannot find the database connection string.

**Cause:** The `.env` file is missing, not saved, or the variable is not set correctly.

**Solution:**

1. Make sure `.env` exists:
   ```bash
   ls .env
   ```
2. Make sure `DATABASE_URL` is set with a real value:
   ```
   DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
   ```
3. If you are using a password with special characters, wrap it in quotes or URL-encode it.

**Expected result:** `pnpm doctor` shows a green checkmark next to `DATABASE_URL`.

---

#### "Missing CLERK_PUBLISHABLE_KEY"

**Problem:** Clerk authentication keys are missing.

**Cause:** The `.env` file still has placeholder values.

**Solution:**

1. Open `.env` in a text editor.
2. Replace `pk_test_your_key_here` with your actual publishable key from the Clerk Dashboard.
3. Replace `sk_test_your_key_here` with your actual secret key.
4. Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set to the same value as `CLERK_PUBLISHABLE_KEY`.
5. Save the file.

**Expected result:** `pnpm doctor` shows green checkmarks for all Clerk variables.

---

### PostgreSQL Issues

#### "Connection refused"

**Problem:** The application cannot connect to PostgreSQL.

**Cause:** PostgreSQL is not running.

**Solution:**

**Docker PostgreSQL:**
```bash
docker ps
```
If the container is not running:
```bash
docker start sarthaksetu-postgres
```

**macOS Homebrew:**
```bash
brew services start postgresql@16
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Windows:**
1. Open Services (press `Win + R`, type `services.msc`, press Enter).
2. Find **PostgreSQL** in the list.
3. Right-click → **Start**.

**Expected result:** `docker ps` shows the container running, or `pg_isready` returns `/accepting connections/`.

---

#### "password authentication failed"

**Problem:** The database password in `DATABASE_URL` is incorrect.

**Cause:** The password does not match what was set during PostgreSQL installation.

**Solution:**

1. Check your `.env` file.
2. Make sure the password in `DATABASE_URL` matches what you set.
3. If you forgot the password, reset it:

**Linux:**
```bash
sudo -u postgres psql -c "ALTER USER sarthaksetu WITH PASSWORD 'newpassword';"
```

Then update `.env` with the new password.

**Expected result:** `psql "$DATABASE_URL" -c "SELECT 1;"` returns a row.

---

#### "database 'sarthaksetu' does not exist"

**Problem:** The database was not created.

**Cause:** Step 5 (creating the database) was skipped or failed.

**Solution:**

**Docker:**
```bash
docker stop sarthaksetu-postgres
docker rm sarthaksetu-postgres
```
Then re-run the Docker command from Step 5.

**Native PostgreSQL:**
```bash
createdb sarthaksetu
```

**Expected result:** `psql -d sarthaksetu -c "SELECT version();"` returns the PostgreSQL version.

---

### Application Startup Issues

#### "PORT already in use" or "EADDRINUSE"

**Problem:** Another program is using port 8080 or 5173.

**Cause:** Another instance of the application, or another program, is already using that port.

**Solution:**

Find what is using the port:

**macOS / Linux:**
```bash
lsof -i :8080
```

**Windows:**
```bash
netstat -ano | findstr :8080
```

**To use a different port:**

Edit `.env`:
```
PORT=8081
FRONTEND_PORT=5174
```

Then run `pnpm dev` again.

**Expected result:** The application starts without the EADDRINUSE error.

---

#### "Frontend shows a blank page"

**Problem:** The browser loads but shows nothing.

**Cause:** The frontend may not be built, or there is a JavaScript error.

**Solution:**

1. Open the browser console (press `F12` → click **Console**).
2. Look for red error messages.
3. Common fixes:
   - Run `pnpm build` and then `pnpm dev` again.
   - Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env`.
   - Hard-refresh the page (`Ctrl + Shift + R` or `Cmd + Shift + R`).

**Expected result:** The homepage loads with the SarthakSetu logo and content.

---

#### "API returns 404 for all routes"

**Problem:** Backend requests are failing.

**Cause:** You might be requesting the wrong URL path.

**Solution:**

Make sure API requests include `/api/`:

- Correct: `http://localhost:8080/api/healthz`
- Incorrect: `http://localhost:8080/healthz`

**Expected result:** `http://localhost:8080/api/healthz` returns `{"status":"ok"}`.

---

### Docker Issues

#### "docker compose up" fails immediately

**Problem:** Containers exit right after starting.

**Cause:** Missing environment variables, or the database is not healthy before the API starts.

**Solution:**

1. Check logs:
   ```bash
   docker compose logs api
   docker compose logs postgres
   ```
2. Make sure `.env` exists in the project root.
3. Make sure `CLERK_PUBLISHABLE_KEY` is set (not a placeholder).
4. Wait longer before checking — the first start downloads images and builds.

**Expected result:** `docker compose ps` shows all containers with status `Up`.

---

#### "Cannot connect to the Docker daemon"

**Problem:** Docker is not running.

**Cause:** Docker Desktop (Windows/macOS) is not open, or the Docker service (Linux) is not started.

**Solution:**

- **Windows/macOS:** Open Docker Desktop and wait for the whale icon to stop moving.
- **Linux:** `sudo systemctl start docker`

**Expected result:** `docker --version` prints a version number.

---

### Clerk Issues

#### "Clerk modal does not appear when I click Sign Up"

**Problem:** The sign-up button does nothing or shows an error.

**Cause:** Redirect URLs may not be configured, or the publishable key is wrong.

**Solution:**

1. Open the browser console (F12 → Console).
2. Look for Clerk error messages.
3. In the Clerk Dashboard, go to **Configure → URLs & redirects**.
4. Make sure `http://localhost:5173/` is in the Redirect URLs.
5. Make sure your `CLERK_PUBLISHABLE_KEY` is correct and not expired.

**Expected result:** Clicking Sign Up opens the Clerk sign-up modal.

---

#### "Clerk says 'Development instances have strict usage limits'"

**Problem:** A yellow banner or console warning about development keys.

**Cause:** You are using development keys (`pk_test_`).

**Solution:** This is normal for local development. To remove the warning for production, switch to a Production instance in the Clerk Dashboard and use `pk_live_` keys.

**Expected result:** In development, this warning is harmless. In production, use live keys.

---

### Build Issues

#### "pnpm build fails with TypeScript errors"

**Problem:** The build step fails with type errors.

**Cause:** Stale generated files or a mismatch between the OpenAPI spec and generated code.

**Solution:**

```bash
pnpm codegen
pnpm run typecheck:libs
pnpm build
```

**Expected result:** Build completes with no errors.

---

## 20. Final Checklist

Use this checklist to verify your setup. Tick each box only after you have confirmed the step works.

### Environment Setup

- [ ] Git is installed (`git --version` prints a version)
- [ ] Node.js is installed (`node --version` prints v20 or higher)
- [ ] pnpm is installed (`pnpm --version` prints a version)
- [ ] PostgreSQL is running (shown in `docker ps` or `brew services list` or `systemctl status postgresql`)

### Project Setup

- [ ] Project is cloned (`ls` shows the `sarthaksetu` folder)
- [ ] Inside the `sarthaksetu` folder
- [ ] Dependencies installed (`pnpm install` completed without errors)
- [ ] `.env` file exists (`ls .env` shows the file)
- [ ] `DATABASE_URL` is set in `.env`
- [ ] `CLERK_PUBLISHABLE_KEY` is set in `.env` (real key, not placeholder)
- [ ] `CLERK_SECRET_KEY` is set in `.env` (real key, not placeholder)
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env` (same as publishable key)

### Database

- [ ] Database created (`sarthaksetu` exists in PostgreSQL)
- [ ] Schema pushed (`pnpm db:push` completed without errors)
- [ ] `pnpm doctor` shows all green checkmarks (✓)

### Application Running

- [ ] `pnpm dev` starts without errors
- [ ] Frontend loads at `http://localhost:5173`
- [ ] API health check returns `{"status":"ok"}` at `http://localhost:8080/api/healthz`
- [ ] Platform stats endpoint returns JSON at `http://localhost:8080/api/stats/platform`

### Authentication

- [ ] Clerk sign-up modal appears when clicking "Sign Up"
- [ ] Can create an account with email and password
- [ ] Email verification code is received
- [ ] Can log in after verification
- [ ] Onboarding form appears after first login
- [ ] Can complete profile (name, phone, address, role)

### Feature Testing

- [ ] (As Donor) Can list a new food donation
- [ ] (As NGO) Can view the interactive map
- [ ] (As NGO) Can claim a donation
- [ ] OTP is generated upon claiming
- [ ] Can view dashboard statistics

### Optional: Docker

- [ ] Docker is installed (`docker --version` works)
- [ ] `docker compose up -d` starts all three services
- [ ] `docker compose ps` shows all containers `Up`
- [ ] Application loads at `http://localhost`

---

> **Congratulations!** If you have ticked all the boxes above, SarthakSetu is fully set up and running on your computer.
>
> If you are stuck on any step, go back to the corresponding section in this guide and follow the troubleshooting instructions.
