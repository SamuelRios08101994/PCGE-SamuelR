Option Explicit

Sub RegistrarIngreso()

    Dim wsForm As Worksheet, wsBD As Worksheet, wsDiario As Worksheet
    Dim cuenta As String, contra As String, obs As String, tipo As String
    Dim monto As Double
    Dim filaBD As Long, filaDiario As Long, nRegistro As Long
    Dim fechaHoy As Date, horaAhora As Date

    Set wsForm = ThisWorkbook.Sheets("Formulario de Ingreso")
    Set wsBD = ThisWorkbook.Sheets("Base de Datos")
    Set wsDiario = ThisWorkbook.Sheets("Libro Diario")

    cuenta = Trim(wsForm.Range("C6").Value)
    contra = Trim(wsForm.Range("C7").Value)
    monto = wsForm.Range("C8").Value
    obs = Trim(wsForm.Range("C9").Value)
    tipo = Trim(wsForm.Range("C10").Value)

    ' --- Validaciones minimas ---
    If cuenta = "" Or contra = "" Or monto <= 0 Or tipo = "" Then
        MsgBox "Complete Cuenta, Contra-cuenta, Monto (mayor a 0) y Tipo de movimiento antes de registrar.", vbExclamation
        Exit Sub
    End If

    If IsError(Application.Match(cuenta, ThisWorkbook.Sheets("Plan de Cuentas").Range("A5:A1241"), 0)) Then
        MsgBox "El código de Cuenta '" & cuenta & "' no existe en el Plan de Cuentas.", vbExclamation
        Exit Sub
    End If
    If IsError(Application.Match(contra, ThisWorkbook.Sheets("Plan de Cuentas").Range("A5:A1241"), 0)) Then
        MsgBox "El código de Contra-cuenta '" & contra & "' no existe en el Plan de Cuentas.", vbExclamation
        Exit Sub
    End If

    fechaHoy = Date
    horaAhora = Time

    ' --- 1) Escribir en Base de Datos (siguiente fila libre desde la fila 5) ---
    filaBD = 5
    Do While wsBD.Cells(filaBD, 1).Value <> ""
        filaBD = filaBD + 1
    Loop
    nRegistro = wsBD.Cells(filaBD - 1, 1).Value + 1
    If filaBD = 5 Then nRegistro = 1

    wsBD.Cells(filaBD, 1).Value = nRegistro          ' N°
    wsBD.Cells(filaBD, 2).Value = fechaHoy            ' Fecha
    wsBD.Cells(filaBD, 3).Value = horaAhora           ' Hora
    wsBD.Cells(filaBD, 4).Value = cuenta              ' Codigo cuenta
    wsBD.Cells(filaBD, 6).Value = contra              ' Codigo contra-cuenta
    wsBD.Cells(filaBD, 8).Value = monto               ' Monto
    wsBD.Cells(filaBD, 9).Value = obs                 ' Observacion
    ' Las columnas E y G (denominaciones) ya tienen formula propia en cada fila

    ' --- 2) Escribir en Libro Diario (dos filas: Debe y Haber) ---
    filaDiario = 5
    Do While wsDiario.Cells(filaDiario, 3).Value <> "" And filaDiario <= 504
        filaDiario = filaDiario + 1
    Loop
    If filaDiario > 503 Then
        MsgBox "El Libro Diario llegó a su límite de filas provisionadas (500). Avísame para ampliarlo.", vbCritical
        Exit Sub
    End If

    Dim esDebeCuentaPrincipal As Boolean
    esDebeCuentaPrincipal = (InStr(tipo, "Debe") > 0)

    ' Fila 1 del asiento: cuenta principal
    wsDiario.Cells(filaDiario, 1).Value = fechaHoy
    wsDiario.Cells(filaDiario, 2).Value = nRegistro
    wsDiario.Cells(filaDiario, 3).Value = cuenta
    wsDiario.Cells(filaDiario, 5).Value = obs
    If esDebeCuentaPrincipal Then
        wsDiario.Cells(filaDiario, 6).Value = monto
    Else
        wsDiario.Cells(filaDiario, 7).Value = monto
    End If

    ' Fila 2 del asiento: contra-cuenta (con el signo contrario)
    wsDiario.Cells(filaDiario + 1, 1).Value = fechaHoy
    wsDiario.Cells(filaDiario + 1, 2).Value = nRegistro
    wsDiario.Cells(filaDiario + 1, 3).Value = contra
    wsDiario.Cells(filaDiario + 1, 5).Value = obs
    If esDebeCuentaPrincipal Then
        wsDiario.Cells(filaDiario + 1, 7).Value = monto
    Else
        wsDiario.Cells(filaDiario + 1, 6).Value = monto
    End If

    ' --- 3) Limpiar el formulario para el siguiente registro ---
    wsForm.Range("C6").Value = ""
    wsForm.Range("C7").Value = ""
    wsForm.Range("C8").Value = ""
    wsForm.Range("C9").Value = ""
    wsForm.Range("C10").Value = ""

    Application.Calculate
    MsgBox "Registro N° " & nRegistro & " guardado en Base de Datos y en el Libro Diario.", vbInformation

End Sub
