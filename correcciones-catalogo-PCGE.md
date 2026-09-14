# Correcciones al catálogo PCGE embebido en `index.html`

Estos 5 errores de tipeo están en el arreglo gigante `CATALOGO` (todo en una
sola línea del archivo). No se pueden arreglar con un script aparte porque
esa variable es privada del script principal — hay que editarlas directo en
`index.html`.

**Cómo aplicarlas:**
1. En GitHub, abre `index.html` → ícono de lápiz (Edit).
2. Usa el buscador del editor (Ctrl+F / Cmd+F) y pega el texto **"Buscar"**
   de cada corrección de abajo (debería encontrar **una sola coincidencia**
   cada vez).
3. Reemplázalo por el texto **"Reemplazar por"**.
4. Repite para las 5 correcciones y haz **Commit changes**.

---

### 1) Código `33404` → `36404`
Estaba clasificado en el grupo equivocado (334 "Unidades de transporte")
en vez de 364 "Depreciación acumulada".

**Buscar:**
```
["33404","Planta productora en producción - Valor razonable","3",1]
```
**Reemplazar por:**
```
["36404","Planta productora en producción - Valor razonable","3",1]
```

---

### 2) Códigos `38472`, `38473`, `38474` → `36472`, `36473`, `36474`
Estaban cayendo en "38 Otros activos" en vez de seguir la secuencia 364xx.

**Buscar:**
```
["38472","Herramientas - Revaluación","3",1],["38473","Unidades de reemplazo - costo","3",1],["38474","Unidades de reemplazo - Revaluación","3",1]
```
**Reemplazar por:**
```
["36472","Herramientas - Revaluación","3",1],["36473","Unidades de reemplazo - costo","3",1],["36474","Unidades de reemplazo - Revaluación","3",1]
```

---

### 3) Código `38352` → `39352`
**Buscar:**
```
["39351","Costo","3",1],["38352","Revaluación","3",1]
```
**Reemplazar por:**
```
["39351","Costo","3",1],["39352","Revaluación","3",1]
```

---

### 4) Código `683351` → `683151` (y su padre `68315` debe ser grupo, no cuenta registrable)
**Buscar:**
```
["68315","Equipos diversos","6",1],["683351","Costo","6",1],["683152","Revaluación","6",1]
```
**Reemplazar por:**
```
["68315","Equipos diversos","6",0],["683151","Costo","6",1],["683152","Revaluación","6",1]
```

---

### 5) Cuentas duplicadas `70111`/`70112` bajo `7012`
`7012` (venta local) estaba marcada como cuenta registrable pero además
tenía "hijos" duplicados de `7011` (venta de exportación). Debe ser un
grupo, con sus propios códigos `70121`/`70122`, igual que el patrón usado
en `7021`/`7022` más abajo en el mismo catálogo.

**Buscar:**
```
["7012","Mercaderías - venta local","7",1],["70111","Terceros","7",1],["70112","Relacionadas","7",1]
```
**Reemplazar por:**
```
["7012","Mercaderías - venta local","7",0],["70121","Terceros","7",1],["70122","Relacionadas","7",1]
```

---

Estas son las que confirmé revisando el catálogo completo. Como el archivo
tiene cientos de códigos, no descarto que existan más — si quieres, puedo
escribirte un pequeño script que recorra todo el catálogo y te liste
automáticamente cualquier código cuyo prefijo no calce con su elemento,
para revisar el resto de una sola vez.
