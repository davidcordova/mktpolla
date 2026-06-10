# Manual de Despliegue en Producción (cPanel Hosting)

Este manual te guiará paso a paso para subir tu aplicación **Polla Mundialista 2026** a tu servicio de hosting que utiliza cPanel.

---

## 1. Requisitos Previos en tu Hosting
* **PHP**: Versión 8.1 o superior.
* **MySQL / MariaDB**: Soporte para motores de base de datos MySQL.
* **Apache**: Módulo `mod_rewrite` habilitado (estándar en cPanel para redirección de URLs).

---

## 2. Preparación y Compilación del Frontend (Hecho)
La aplicación frontend de React ya ha sido compilada. Los archivos compilados y listos para subir a internet se encuentran generados en la carpeta local:
`c:\Users\LuisDavidCordovaLope\Documents\mkt\mktpolla\frontend\dist`

---

## 3. Configuración de la Base de Datos en cPanel

1. Inicia sesión en tu **cPanel**.
2. Dirígete a la sección de bases de datos y haz clic en **MySQL® Database Wizard** (Asistente de Bases de Datos MySQL).
3. **Paso 1**: Crea la base de datos (por ejemplo: `miusuario_polla2026`). Anota el nombre exacto.
4. **Paso 2**: Crea un usuario de base de datos (por ejemplo: `miusuario_admin`) y asígnale una contraseña segura. Anota el usuario y la contraseña.
5. **Paso 3**: Asigna el usuario a la base de datos marcando la opción de **ALL PRIVILEGES** (Todos los privilegios) y haz clic en continuar.

---

## 4. Configurar Conexión en el Backend de PHP

El archivo [backend/config/db.php](file:///c:/Users/LuisDavidCordovaLope/Documents/mkt/mktpolla/backend/config/db.php) ya cuenta con un sistema de **detección dinámica de entorno** (desarrollo local vs producción). 

Las credenciales que proporcionaste para producción ya están configuradas de forma predeterminada:
* **Usuario**: `alterno_mktpolla`
* **Base de datos**: `alterno_mktpolla`
* **Contraseña**: `M1un1c4cl4v3`

El archivo define automáticamente la conexión dependiendo de dónde esté corriendo:
```php
if ($isLocal) {
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'polla_mundialista_2026');
} else {
    define('DB_HOST', 'localhost');
    define('DB_USER', 'alterno_mktpolla');
    define('DB_PASS', 'M1un1c4cl4v3');
    define('DB_NAME', 'alterno_mktpolla');
}
```
*Si en el futuro cambias el usuario o contraseña de tu cPanel, solo debes actualizar este bloque en el archivo `backend/config/db.php`.*


---

## 5. Importar las Semillas del Torneo en la Base de Datos

1. En tu cPanel, dirígete a la sección de herramientas y abre **phpMyAdmin**.
2. En la barra lateral izquierda, selecciona la base de datos que creaste (`miusuario_polla2026`).
3. Ve a la pestaña **Importar** (Import) en la barra superior.
4. Haz clic en seleccionar archivo y sube el archivo de la estructura de tablas de tu proyecto local:
   `database/schema.sql`
   Presiona **Importar** en la parte inferior para ejecutar las queries.
5. De la misma forma, repite el paso importando el archivo de semillas iniciales:
   `database/seed.sql`
   Esto poblará la base de datos con los 48 equipos, el calendario de partidos y creará el usuario administrador por defecto con las siguientes credenciales:
   * **Correo**: `admin@polla.com`
   * **Contraseña**: `M1un1c4cl4v3`

---

## 6. Subir los Archivos al Servidor

Para que tu aplicación cargue en tu dominio principal (ej: `https://tudominio.com`), organiza los archivos de la siguiente manera dentro de la carpeta raíz de tu hosting (usualmente llamada **`public_html`**):

### Estructura Final en `public_html`:
```text
public_html/
│
├── api/                   <-- Copiar aquí los contenidos de tu carpeta local "/backend/api"
├── config/                <-- Copiar aquí la carpeta local "/backend/config" (con el db.php editado)
├── utils/                 <-- Copiar aquí la carpeta local "/backend/utils"
│
├── assets/                <-- Copiar aquí los archivos estáticos del frontend (de "/frontend/dist/assets")
├── index.html             <-- Archivo index.html del frontend (de "/frontend/dist/index.html")
└── .htaccess              <-- Archivo de configuración Apache (ver sección 7)
```

> [!NOTE]
> Puedes subir los archivos utilizando el **Administrador de Archivos (File Manager)** de cPanel comprimiéndolos en formato `.zip` localmente y descomprimiéndolos en el servidor, o usando un cliente FTP como **FileZilla**.

> [!WARNING]
> **Falso Positivo de Antivirus en cPanel (Sanesecurity.Foxhole.JS_Zip_2)**
> El antivirus de cPanel (Imunify360 / ClamAV) a veces detecta erróneamente los archivos `.zip` que contienen código JavaScript minificado (como el bundle generado por Vite) como un supuesto virus falso positivo (`Sanesecurity.Foxhole.JS_Zip_2`). 
> 
> **Cómo solucionarlo**:
> 1. **Método FTP (Recomendado)**: Utiliza un cliente FTP como **FileZilla** para subir la carpeta `assets` directamente sin comprimir en ZIP. Esto subirá los archivos `.js` y `.css` de uno en uno de forma transparente y evita el disparador de firmas basadas en archivos ZIP del hosting.
> 2. **Método Web Directo**: En el Administrador de Archivos de tu cPanel, crea la carpeta `assets` de manera manual, entra en ella, presiona **Subir** (Upload) y arrastra los archivos individuales (`.js`, `.css`, etc.) que están dentro de tu carpeta local `frontend/dist/assets`. Subirlos descomprimidos no activará la alerta.

---

## 7. Configurar el Archivo `.htaccess` (Muy Importante)

React Router utiliza rutas dinámicas virtuales del lado del cliente (ej. `/group-predictions`, `/bracket-predictions`, `/rankings`). Si un usuario recarga la página o entra directamente a una subruta, Apache dará un error **404 Not Found**. 

Para resolverlo, debes crear un archivo llamado **`.htaccess`** en tu carpeta de la polla (ej. `public_html/mktpolla/.htaccess`) con el siguiente contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /mktpolla/

  # Habilitar el paso del encabezado de Autorización (Authorization Header) a PHP 
  # (Esencial en cPanel con CGI/FastCGI/PHP-FPM, de lo contrario dará error 401 Unauthorized)
  RewriteCond %{HTTP:Authorization} ^(.*)
  RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]

  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /mktpolla/index.html [L]
</IfModule>
```

---

## 8. Verificación Final en Producción
Una vez subidos los archivos:
1. Entra a tu dominio `https://tudominio.com`. Debería cargar el Dashboard principal de forma premium y veloz.
2. Inicia sesión como administrador (`admin@polla.com` / `M1un1c4cl4v3`).
3. Ve al Panel de Administración e intenta registrar resultados oficiales o simular etapas.
4. Inicia sesión con el usuario de pruebas `juan@gmail.com` (contraseña `user123`) para realizar pronósticos grupales o de bracket y verificar que se guarden e inhabiliten adecuadamente en la base de datos de producción.
