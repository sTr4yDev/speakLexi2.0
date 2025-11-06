import bcrypt
from datetime import datetime

# ============================================
# USUARIOS A CREAR
# ============================================
usuarios = [
    {
        "nombre": "Luis",
        "primer_apellido": "Gómez",
        "segundo_apellido": "Hernández",
        "correo": "estudiante@speaklexi.com",
        "rol": "alumno",
        "password": "Estudiante123!"
    },
    {
        "nombre": "María",
        "primer_apellido": "Rodríguez",
        "segundo_apellido": "Santos",
        "correo": "profesor@speaklexi.com",
        "rol": "profesor",
        "password": "Profesor123!"
    },
    {
        "nombre": "Carlos",
        "primer_apellido": "Administrador",
        "segundo_apellido": "Principal",
        "correo": "admin@speaklexi.com",
        "rol": "admin",
        "password": "Admin123!"
    },
    {
        "nombre": "Elena",
        "primer_apellido": "Martínez",
        "segundo_apellido": "Díaz",
        "correo": "mantenimiento@speaklexi.com",
        "rol": "admin",
        "password": "Mante123!",
        "cargo": "Técnico de mantenimiento"
    }
]

# ============================================
# FUNCIÓN PRINCIPAL
# ============================================
def generar_inserts_usuarios():
    print("-- ============================================")
    print("-- INSERCIÓN DE USUARIOS CON BCRYPT")
    print("-- ============================================")
    
    inserts = []
    
    for user in usuarios:
        # Encriptar contraseña con bcrypt
        hashed = bcrypt.hashpw(user["password"].encode("utf-8"), bcrypt.gensalt(12))
        hashed_str = hashed.decode("utf-8")
        
        # Crear INSERT para tabla usuarios
        insert_usuario = f"""INSERT INTO usuarios (
    nombre, primer_apellido, segundo_apellido, correo,
    contrasena_hash, rol, estado_cuenta, correo_verificado,
    codigo_verificacion, expira_verificacion, ultimo_acceso
) VALUES (
    '{user['nombre']}', '{user['primer_apellido']}', '{user['segundo_apellido']}', '{user['correo']}',
    '{hashed_str}', '{user['rol']}', 'activo', TRUE,
    '000000', DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW()
);"""
        
        inserts.append(insert_usuario)
        inserts.append(f"SET @usuario_id = LAST_INSERT_ID();")
        
        # Crear INSERT para perfil_usuarios
        nombre_completo = f"{user['nombre']} {user['primer_apellido']} {user['segundo_apellido']}"
        insert_perfil = f"""INSERT INTO perfil_usuarios (usuario_id, nombre_completo, foto_perfil, telefono)
VALUES (@usuario_id, '{nombre_completo}', 'default-avatar.png', '+52 600 000 000');"""
        
        inserts.append(insert_perfil)
        
        # Si es admin, crear INSERT para perfil_administradores
        if user["rol"] == "admin":
            departamento = "Infraestructura" if "mantenimiento" in user["correo"] else "Desarrollo"
            cargo = user.get("cargo", "Administrador")
            
            insert_admin = f"""INSERT INTO perfil_administradores (usuario_id, departamento, nivel_acceso, cargo, creado_en)
VALUES (@usuario_id, '{departamento}', 'admin', '{cargo}', NOW());"""
            
            inserts.append(insert_admin)
        
        inserts.append("")  # Línea en blanco para separar usuarios
    
    # Imprimir todos los INSERTs
    for insert in inserts:
        print(insert)
    
    print("-- ============================================")
    print("-- DATOS DE ACCESO PARA PRUEBAS")
    print("-- ============================================")
    for u in usuarios:
        print(f"-- • {u['correo']} - {u['rol']} - Contraseña: {u['password']}")

# ============================================
# EJECUCIÓN
# ============================================
if __name__ == "__main__":
    generar_inserts_usuarios()