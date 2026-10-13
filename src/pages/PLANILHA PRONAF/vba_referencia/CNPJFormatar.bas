Attribute VB_Name = "CNPJFormatar"
Option Explicit

' =========================================================
' FUNÇÃO: SomenteAlfaNum
' OBJETIVO:
'   Remover qualquer caractere que não seja letra ou número,
'   retornando o texto em maiúsculas.
' EXEMPLOS:
'   "07.237.373/0001-20" -> "07237373000120"
'   "ab.c-12"            -> "ABC12"
' =========================================================
Public Function SomenteAlfaNum(ByVal Texto As String) As String
    Dim i As Long
    Dim ch As String
    Dim Ret As String
    
    Ret = ""
    
    ' Percorre cada caractere do texto informado
    For i = 1 To Len(Texto)
        ch = Mid$(Texto, i, 1)
        
        ' Mantém apenas letras e números
        If ch Like "[0-9A-Za-z]" Then
            Ret = Ret & UCase$(ch)
        End If
    Next i
    
    SomenteAlfaNum = Ret
End Function

' =========================================================
' FUNÇÃO: ValidaCPF
' OBJETIVO:
'   Validar CPF numérico com 11 dígitos, inclusive os
'   dígitos verificadores.
' OBSERVAÇÕES:
'   - Remove máscara antes de validar
'   - Completa com zero à esquerda, se necessário
'   - Rejeita sequências repetidas (111..., 222..., etc.)
' =========================================================
Public Function ValidaCPF(ByVal CPF As String) As Boolean
    Dim i As Long
    Dim Soma As Long
    Dim Resto As Long
    Dim DV1 As Long
    Dim DV2 As Long
    
    ' Limpa o CPF e força 11 posições
    CPF = SomenteAlfaNum(CPF)
    CPF = Right$(String$(11, "0") & CPF, 11)
    
    ' Se não tiver 11 caracteres, é inválido
    If Len(CPF) <> 11 Then
        ValidaCPF = False
        Exit Function
    End If
    
    ' Rejeita CPFs com todos os dígitos iguais
    Select Case CPF
        Case "00000000000", "11111111111", "22222222222", "33333333333", _
             "44444444444", "55555555555", "66666666666", "77777777777", _
             "88888888888", "99999999999"
            ValidaCPF = False
            Exit Function
    End Select
    
    ' -----------------------------------------------------
    ' Cálculo do 1º dígito verificador
    ' -----------------------------------------------------
    Soma = 0
    For i = 1 To 9
        Soma = Soma + CLng(Mid$(CPF, i, 1)) * (11 - i)
    Next i
    
    Resto = (Soma * 10) Mod 11
    If Resto = 10 Then Resto = 0
    DV1 = Resto
    
    ' -----------------------------------------------------
    ' Cálculo do 2º dígito verificador
    ' -----------------------------------------------------
    Soma = 0
    For i = 1 To 10
        Soma = Soma + CLng(Mid$(CPF, i, 1)) * (12 - i)
    Next i
    
    Resto = (Soma * 10) Mod 11
    If Resto = 10 Then Resto = 0
    DV2 = Resto
    
    ' Compara os DVs calculados com os informados
    ValidaCPF = (DV1 = CLng(Mid$(CPF, 10, 1)) And DV2 = CLng(Mid$(CPF, 11, 1)))
End Function

' =========================================================
' FUNÇÃO: FormatarCPF
' OBJETIVO:
'   Formatar o CPF no padrão de integração:
'   000000000-00
' EXEMPLO:
'   3345628877 -> 033456288-77
' =========================================================
Public Function FormatarCPF(ByVal CPF As String) As String
    CPF = SomenteAlfaNum(CPF)
    
    ' Garante 11 dígitos, preservando zeros à esquerda
    CPF = Right$(String$(11, "0") & CPF, 11)
    
    ' Formata no padrão sem pontos
    FormatarCPF = _
        Left$(CPF, 9) & "-" & _
        Right$(CPF, 2)
End Function

' =========================================================
' FUNÇÃO: ValidaCNPJ
' OBJETIVO:
'   Validar CNPJ numérico com 14 dígitos, inclusive os
'   dígitos verificadores.
' OBSERVAÇÕES:
'   - Remove máscara antes de validar
'   - Completa com zero à esquerda, se necessário
'   - Rejeita sequências repetidas
' =========================================================
Public Function ValidaCNPJ(ByVal cnpj As String) As Boolean
    Dim i As Long
    Dim Soma As Long
    Dim Resto As Long
    Dim DV1 As Long
    Dim DV2 As Long
    Dim Peso1 As Variant
    Dim Peso2 As Variant
    
    cnpj = SomenteAlfaNum(cnpj)
    cnpj = Right$(String$(14, "0") & cnpj, 14)
    
    ' Verifica tamanho
    If Len(cnpj) <> 14 Then
        ValidaCNPJ = False
        Exit Function
    End If
    
    ' Verifica se contém apenas números
    If Not cnpj Like String(14, "#") Then
        ValidaCNPJ = False
        Exit Function
    End If
    
    ' Rejeita sequências iguais
    Select Case cnpj
        Case "00000000000000", "11111111111111", "22222222222222", "33333333333333", _
             "44444444444444", "55555555555555", "66666666666666", "77777777777777", _
             "88888888888888", "99999999999999"
            ValidaCNPJ = False
            Exit Function
    End Select
    
    ' Pesos para cálculo dos DVs
    Peso1 = Array(5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    Peso2 = Array(6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    
    ' -----------------------------------------------------
    ' Cálculo do 1º dígito verificador
    ' -----------------------------------------------------
    Soma = 0
    For i = 1 To 12
        Soma = Soma + CLng(Mid$(cnpj, i, 1)) * Peso1(i - 1)
    Next i
    
    Resto = Soma Mod 11
    If Resto < 2 Then
        DV1 = 0
    Else
        DV1 = 11 - Resto
    End If
    
    ' -----------------------------------------------------
    ' Cálculo do 2º dígito verificador
    ' -----------------------------------------------------
    Soma = 0
    For i = 1 To 13
        Soma = Soma + CLng(Mid$(cnpj, i, 1)) * Peso2(i - 1)
    Next i
    
    Resto = Soma Mod 11
    If Resto < 2 Then
        DV2 = 0
    Else
        DV2 = 11 - Resto
    End If
    
    ' Compara os DVs calculados com os informados
    ValidaCNPJ = (DV1 = CLng(Mid$(cnpj, 13, 1)) And DV2 = CLng(Mid$(cnpj, 14, 1)))
End Function

' =========================================================
' FUNÇÃO: FormatarCNPJ
' OBJETIVO:
'   Formatar CNPJ numérico no padrão tradicional:
'   00.000.000/0000-00
' =========================================================
Public Function FormatarCNPJ(ByVal cnpj As String) As String
    
   cnpj = SomenteAlfaNum(cnpj)
    
    ' Garante 14 dígitos com zero à esquerda
    cnpj = Right$(String$(14, "0") & cnpj, 14)
    
    ' Formata no padrão: 000000000000-00
    FormatarCNPJ = _
        Left$(cnpj, 12) & "-" & _
        Right$(cnpj, 2)
End Function

' =========================================================
' FUNÇÃO: ValorCaractere
' OBJETIVO:
'   Converter um caractere alfanumérico em valor numérico
'   para uso no cálculo do DV do CNPJ alfanumérico.
' REGRA UTILIZADA:
'   Valor = Asc(caractere) - 48
' EXEMPLOS:
'   "0" -> 0
'   "9" -> 9
'   "A" -> 17
'   "B" -> 18
' =========================================================
Public Function ValorCaractere(ByVal ch As String) As Integer
    ch = UCase$(ch)
    ValorCaractere = Asc(ch) - 48
End Function

' =========================================================
' FUNÇÃO: CalculaDVModulo11
' OBJETIVO:
'   Calcular um dígito verificador pelo módulo 11,
'   utilizando pesos previamente informados.
' USO:
'   Função auxiliar para CNPJ alfanumérico
' =========================================================
Public Function CalculaDVModulo11(ByVal Base As String, ByVal Pesos As Variant) As Integer
    Dim i As Long
    Dim Soma As Long
    
    Soma = 0
    
    ' Multiplica cada caractere convertido pelo peso correspondente
    For i = 1 To Len(Base)
        Soma = Soma + ValorCaractere(Mid$(Base, i, 1)) * Pesos(i - 1)
    Next i
    
    ' Regra do módulo 11
    If (Soma Mod 11) < 2 Then
        CalculaDVModulo11 = 0
    Else
        CalculaDVModulo11 = 11 - (Soma Mod 11)
    End If
End Function

' =========================================================
' FUNÇÃO: CNPJAlfa_Validar
' OBJETIVO:
'   Validar CNPJ alfanumérico com 14 posições, sendo:
'   - 12 caracteres base (letras e/ou números)
'   - 2 dígitos verificadores finais
' =========================================================
Public Function CNPJAlfa_Validar(ByVal cnpj As String) As Boolean
    Dim Base12 As String
    Dim DVInformado As String
    Dim DV1 As Integer
    Dim DV2 As Integer
    Dim Pesos1 As Variant
    Dim Pesos2 As Variant
    
    cnpj = SomenteAlfaNum(cnpj)
    
    ' Verifica tamanho
    If Len(cnpj) <> 14 Then
        CNPJAlfa_Validar = False
        Exit Function
    End If
    
    ' Separa base e DVs
    Base12 = Left$(cnpj, 12)
    DVInformado = Right$(cnpj, 2)
    
    ' Os 2 últimos caracteres devem ser numéricos
    If Not DVInformado Like "##" Then
        CNPJAlfa_Validar = False
        Exit Function
    End If
    
    ' Pesos para cálculo
    Pesos1 = Array(5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    Pesos2 = Array(6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    
    ' Calcula DVs
    DV1 = CalculaDVModulo11(Base12, Pesos1)
    DV2 = CalculaDVModulo11(Base12 & CStr(DV1), Pesos2)
    
    ' Compara com os DVs informados
    CNPJAlfa_Validar = (DVInformado = CStr(DV1) & CStr(DV2))
End Function

' =========================================================
' FUNÇÃO: CNPJAlfa_Formatar
' OBJETIVO:
'   Formatar CNPJ alfanumérico no padrão de integração:
'   000000000000-00
' EXEMPLO:
'   07237373000120 -> 072373730001-20
' =========================================================
Public Function CNPJAlfa_Formatar(ByVal cnpj As String) As String
    cnpj = SomenteAlfaNum(cnpj)
    
    ' Garante 14 caracteres, preservando zeros à esquerda
    cnpj = Right$(String$(14, "0") & cnpj, 14)
    
    ' Formata com hífen antes dos 2 dígitos finais
    CNPJAlfa_Formatar = _
        Left$(cnpj, 12) & "-" & _
        Right$(cnpj, 2)
End Function

' =========================================================
' SUB: ProcessarDocumento
' OBJETIVO:
'   Ler o conteúdo da célula e decidir automaticamente se:
'   - é CPF
'   - é CNPJ numérico
'   - é CNPJ alfanumérico
'
' REGRAS:
'   - remove máscara
'   - padroniza tamanho com zeros à esquerda
'   - formata o documento
'   - valida os dígitos verificadores
'   - se inválido:
'       * pinta a fonte de vermelho
'       * mostra mensagem
'       * limpa a célula
'       * retorna fonte para preto
' =========================================================
Public Sub ProcessarDocumento(ByVal cel As Range)
    Dim TextoDoc As String
    Dim CelBase As Range
    
    On Error GoTo TrataErro
    
    If cel Is Nothing Then Exit Sub
    If IsError(cel.Value) Then Exit Sub
    
    ' Se a célula for mesclada, trabalha sempre com a 1ª célula da área mesclada
    If cel.MergeCells Then
        Set CelBase = cel.MergeArea.Cells(1, 1)
    Else
        Set CelBase = cel
    End If
    
    TextoDoc = Trim$(CStr(CelBase.Value))
    TextoDoc = SomenteAlfaNum(TextoDoc)
    
    If TextoDoc = vbNullString Then
        CelBase.Font.Color = vbBlack
        Exit Sub
    End If
    
    CelBase.NumberFormat = "@"
    
    Select Case Len(TextoDoc)
    
        Case 10, 11
            TextoDoc = Right$(String$(11, "0") & TextoDoc, 11)
            CelBase.Value = FormatarCPF(TextoDoc)
            
            If ValidaCPF(TextoDoc) Then
                CelBase.Font.Color = vbBlack
            Else
                CelBase.Font.Color = vbRed
                DoEvents
                MsgBox "CPF ou CNPJ  inválido.Digite novamente.", vbExclamation, "Validação"
                CelBase.ClearContents
                CelBase.Font.Color = vbBlack
            End If
        
        Case 13, 14
            TextoDoc = Right$(String$(14, "0") & TextoDoc, 14)
            
            If TextoDoc Like "*[A-Z]*" Then
                CelBase.Value = CNPJAlfa_Formatar(TextoDoc)
                
                If CNPJAlfa_Validar(TextoDoc) Then
                    CelBase.Font.Color = vbBlack
                Else
                    CelBase.Font.Color = vbRed
                    DoEvents
                    MsgBox "CNPJ alfanumérico inválido.Digite novamente", vbExclamation, "Validação"
                    CelBase.ClearContents
                    CelBase.Font.Color = vbBlack
                End If
            Else
                CelBase.Value = FormatarCNPJ(TextoDoc)
                
                If ValidaCNPJ(TextoDoc) Then
                    CelBase.Font.Color = vbBlack
                Else
                    CelBase.Font.Color = vbRed
                    DoEvents
                    MsgBox "CNPJ inválido. Digite novamente.", vbExclamation, "Validação"
                    CelBase.ClearContents
                    CelBase.Font.Color = vbBlack
                End If
            End If
        
        Case Else
            CelBase.Font.Color = vbRed
            DoEvents
            MsgBox "CPF ou CNPJ inválido.", vbExclamation, "Validação"
            CelBase.ClearContents
            CelBase.Font.Color = vbBlack
    End Select
    
    Exit Sub

TrataErro:
    On Error Resume Next
    If Not CelBase Is Nothing Then
        CelBase.Font.Color = vbRed
        DoEvents
       '' MsgBox "Erro ao validar documento: " & Err.Number & " - " & Err.Description, vbExclamation, "Validação"
        CelBase.ClearContents
        CelBase.Font.Color = vbBlack
    End If
End Sub


Public Sub GravarCpfCnpjMesclado(ByVal celDestino As Range, ByVal valorOrigem As Variant)

    Dim s As String

    If IsNumeric(valorOrigem) Then
        s = Format$(CDbl(valorOrigem), "0")
    Else
        s = CStr(valorOrigem)
    End If

    s = Replace(s, ".", "")
    s = Replace(s, "/", "")
    s = Replace(s, "-", "")
    s = Replace(s, " ", "")
    s = Replace(s, "'", "")

    If Len(s) = 14 Then
        s = Left(s, 2) & "." & Mid(s, 3, 3) & "." & Mid(s, 6, 3) & "/" & Mid(s, 9, 4) & "-" & Right(s, 2)
    ElseIf Len(s) = 11 Then
        s = Left(s, 3) & "." & Mid(s, 4, 3) & "." & Mid(s, 7, 3) & "-" & Right(s, 2)
    End If

    With celDestino.MergeArea
        .NumberFormat = "@"
        .Cells(1, 1).ClearContents
        .Cells(1, 1).Value2 = CStr(s)
    End With

End Sub

