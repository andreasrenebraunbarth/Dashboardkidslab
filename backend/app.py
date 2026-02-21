import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    ''')
    
    # Ideas table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )
    ''')
    
    # Rooms table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

# --- Auth Endpoints ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')
    
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                     (name, email, password, role))
        conn.commit()
        return jsonify({'message': 'User registered', 'user': {'name': name, 'email': email, 'role': role}}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 400
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    if user and user['password'] == password:
        return jsonify({
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        })
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    users = conn.execute('SELECT name, email, role FROM users').fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route('/api/users/<email>', methods=['PUT'])
def update_user(email):
    data = request.json
    name = data.get('name')
    password = data.get('password')
    role = data.get('role')
    
    conn = get_db_connection()
    if name:
        conn.execute('UPDATE users SET name = ? WHERE email = ?', (name, email))
    if password:
        conn.execute('UPDATE users SET password = ? WHERE email = ?', (password, email))
    if role:
        conn.execute('UPDATE users SET role = ? WHERE email = ?', (role, email))
    conn.commit()
    conn.close()
    return jsonify({'message': 'User updated'})

@app.route('/api/users/<email>', methods=['DELETE'])
def delete_user(email):
    conn = get_db_connection()
    conn.execute('DELETE FROM users WHERE email = ?', (email,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'User deleted'})

# --- Ideas Endpoints ---

@app.route('/api/ideas', methods=['GET'])
def get_ideas():
    conn = get_db_connection()
    ideas = conn.execute('SELECT * FROM ideas ORDER BY timestamp DESC').fetchall()
    conn.close()
    return jsonify([dict(i) for i in ideas])

@app.route('/api/ideas', methods=['POST'])
def add_idea():
    data = request.json
    content = data.get('content')
    author = data.get('author')
    timestamp = int(time.time() * 1000)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO ideas (content, author, timestamp) VALUES (?, ?, ?)',
                   (content, author, timestamp))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': new_id, 'content': content, 'author': author, 'timestamp': timestamp}), 201

@app.route('/api/ideas/<int:idea_id>', methods=['DELETE'])
def delete_idea(idea_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM ideas WHERE id = ?', (idea_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Idea deleted'})

# --- Rooms Endpoints ---

@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    conn = get_db_connection()
    rooms = conn.execute('SELECT * FROM rooms').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rooms])

@app.route('/api/rooms', methods=['POST'])
def add_room():
    data = request.json
    name = data.get('name')
    timestamp = int(time.time() * 1000)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO rooms (name, timestamp) VALUES (?, ?)', (name, timestamp))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': new_id, 'name': name, 'timestamp': timestamp}), 201

@app.route('/api/rooms/<int:room_id>', methods=['DELETE'])
def delete_room(room_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM rooms WHERE id = ?', (room_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Room deleted'})

@app.route('/api/rooms/<int:room_id>', methods=['PUT'])
def update_room(room_id):
    data = request.json
    name = data.get('name')
    conn = get_db_connection()
    conn.execute('UPDATE rooms SET name = ? WHERE id = ?', (name, room_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Room updated'})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
