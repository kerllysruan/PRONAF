Attribute VB_Name = "mdlCritica"
' PRONF NORMAL - CRITICA PROJETOS

Public lngMsgAvisos As Long
Public lngMsgErros As Long

Public Function ValidaNome(ByVal fa_nome As String, ByVal fa_tppes As String)
'Função para validar sequência de caracteres (evitando repetições)
'Autora: Lígia Rosane(Unisys) - Versão PowerBuilder
'Versão Visual Basic por Washington Santos (Media System)
    Dim ls_letra As String, ls_ant As String, ls_atu As String, ls_prx As String, ls_dprx As String
    Dim li_i As Integer, li_tamnome As Integer, li_pos As Integer, li_n As Integer
    Dim errMensagem As String
    'Sequencia de 4 caracteres iguais... (posição atual, -1, +1, +2)
    For li_i = 2 To Len(Trim(fa_nome))
        ls_ant = Mid(fa_nome, li_i - 1, 1)
        ls_atu = Mid(fa_nome, li_i, 1)
        ls_prx = Mid(fa_nome, li_i + 1, 1)
        ls_dprx = Mid(fa_nome, li_i + 2, 1)
    
        If ls_ant = ls_atu And ls_atu = ls_prx And ls_atu = ls_dprx Then
            errMensagem = "Sequência de caracteres inválida (caracteres repetidos)!"
            GoTo NomeInvalido
        End If
    Next li_i

    'Sequencia de 3 caracteres iguais... (posição atual, -1, +1)
    For li_i = 2 To Len(Trim(fa_nome))
        ls_ant = Mid(fa_nome, li_i - 1, 1)
        ls_atu = Mid(fa_nome, li_i, 1)
        ls_prx = Mid(fa_nome, li_i + 1, 1)
    
        If ls_ant = ls_atu And ls_atu = ls_prx Then
            errMensagem = "Sequência de caracteres inválida (caracteres repetidos)!"
            GoTo NomeInvalido
        End If
    Next li_i

    'O primeiro caracter não pode ser branco
    If Mid(fa_nome, 1, 1) = " " Then
       errMensagem = "O primeiro caracter de um NOME não pode ser vazio!"
       GoTo NomeInvalido
    End If

    'Se for pessoa Física, não permitir cadastrar o primeiro nome com menos de 2 letras
    If fa_tppes = "F" Then

        If InStr(1, fa_nome, " ") > 0 And InStr(1, fa_nome, " ") < 3 Then
            errMensagem = "O primeiro NOME do cliente deve possuir mais de uma letra!"
            GoTo NomeInvalido
        End If
    
        'Verifica se o primeiro caracter é uma letra e se não possui caracteres inválidos
        '(os valores apóstrofo, ponto, hífen podem ser aceitos em nomes)
        If Not Application.WorksheetFunction.IsText(fa_nome) Then
            errMensagem = "Sequência de caracteres inválida!"
            GoTo NomeInvalido
        End If

        'Não permitir cadastrar nenhum dos nomes PF com menos de 2 letras
        li_tamnome = Len(Trim(fa_nome))
    
        'O nome de pessoa física não pode ser abreviado (Auditoria, 08/09/2003)
        If InStr(fa_nome, ".") Or InStr(fa_nome, ",") Then
            errMensagem = "O nome de pessoa física não pode ser abreviado!"
            GoTo NomeInvalido
            
        End If

        For li_n = 1 To li_tamnome
            li_pos = InStr(li_n, fa_nome, " ")
            If li_pos > 0 Then
                'Contar qtas posições da última posição até o próximo espaço
                If (li_pos - li_n) < 2 Then
                    'testar se último nome (alterado para incluir cliente com nome terminado com somente 1 letra - 08/09/2003)
                    If (li_tamnome - li_pos) = 1 And (li_tamnome - li_n) = 1 Then

                        If MsgBox("O último nome possui apenas uma letra, deseja continuar o cadastro?", vbQuestion + vbYesNo) = vbNo Then
                            errMensagem = "Complete o nome!"
                            GoTo NomeInvalido
                        End If
                    End If
                End If
            End If
        Next li_n
    End If

    If (Len(fa_nome) < 30 And InStr(Trim(fa_nome), " ") = 0) Then
       errMensagem = "O campo Nome/Logradouro deve ser composto por pelo menos 2 nomes!"
       GoTo NomeInvalido
    End If

    'Não permitir cadastrar valores como "Não consta", "Não existe"
    If UCase(Mid(fa_nome, 1, 4)) = "NAO " Or UCase(Mid(fa_nome, 1, 4)) = "NÃO " Then
       errMensagem = "Sequência inicial de caracteres inválida!"
       GoTo NomeInvalido
    End If

    'A última posição do nome não pode ser um ponto
    li_tamnome = Len(Trim(fa_nome))
    If Mid(fa_nome, li_tamnome, 1) = "." Then
       errMensagem = "O último caracter de um NOME não pode ser um ponto!"
       GoTo NomeInvalido
    End If
    ValidaNome = True
    Exit Function
    
NomeInvalido:
    'MsgBox errMensagem, vbExclamation  'GSOL00982018 - Sprint 9 - Retirar a Critica em tempo real e passa a criticar no relatório de crítica
    ValidaNome = False
End Function
Public Function VerDataCron(ByVal strPeriodo As String)
       On Error Resume Next
       VerDataCron = False
       If Len(Trim(strPeriodo)) = 0 Then
          VerDataCron = True
          Exit Function
       End If
       If Len(strPeriodo) <> 6 Then Exit Function
       strPeriodo = "01/" & Mid(strPeriodo, 1, 2) & "/" & Mid(strPeriodo, 3, 4)
       If Not IsDate(strPeriodo) Then Exit Function
       VerDataCron = True
End Function

Function Verifica_CGC(VLL_CGC As String) As Boolean

    Dim NRL_CGC As String
    Dim NRL_SOMA As Long
    Dim NRL_DIG1 As Integer
    Dim NRL_DIG2 As Integer
    Dim i As Integer
    If Len(VLL_CGC) > 14 Then
       Verifica_CGC = False
       Exit Function
    End If
    
    NRL_CGC = Format(VLL_CGC, "000000000000000")
    For i = 1 To Len(Trim(NRL_CGC))
        If Not IsNumeric(Mid$(NRL_CGC, i, 1)) Then
           Verifica_CGC = False
           Exit Function
        End If
    Next i


    NRL_SOMA = Val(Mid(NRL_CGC, 1, 1)) * 6 + Val(Mid(NRL_CGC, 2, 1)) * 5 + Val(Mid(NRL_CGC, 3, 1)) * 4 + Val(Mid(NRL_CGC, 4, 1)) * 3 + Val(Mid(NRL_CGC, 5, 1)) * 2 + Val(Mid(NRL_CGC, 6, 1)) * 9 + Val(Mid(NRL_CGC, 7, 1)) * 8 + Val(Mid(NRL_CGC, 8, 1)) * 7 + Val(Mid(NRL_CGC, 9, 1)) * 6 + Val(Mid(NRL_CGC, 10, 1)) * 5 + Val(Mid(NRL_CGC, 11, 1)) * 4 + Val(Mid(NRL_CGC, 12, 1)) * 3 + Val(Mid(NRL_CGC, 13, 1)) * 2
    'NRL_DIG1 = Right(11 - NRL_SOMA Mod 11, 1)
    NRL_DIG1 = 11 - NRL_SOMA Mod 11
    If NRL_DIG1 = 10 Or NRL_DIG1 = 11 Then
        NRL_DIG1 = 0
    End If

    NRL_SOMA = Val(Mid(NRL_CGC, 1, 1)) * 7 + Val(Mid(NRL_CGC, 2, 1)) * 6 + Val(Mid(NRL_CGC, 3, 1)) * 5 + Val(Mid(NRL_CGC, 4, 1)) * 4 + Val(Mid(NRL_CGC, 5, 1)) * 3 + Val(Mid(NRL_CGC, 6, 1)) * 2 + Val(Mid(NRL_CGC, 7, 1)) * 9 + Val(Mid(NRL_CGC, 8, 1)) * 8 + Val(Mid(NRL_CGC, 9, 1)) * 7 + Val(Mid(NRL_CGC, 10, 1)) * 6 + Val(Mid(NRL_CGC, 11, 1)) * 5 + Val(Mid(NRL_CGC, 12, 1)) * 4 + Val(Mid(NRL_CGC, 13, 1)) * 3 + Val(Mid(NRL_CGC, 14, 1)) * 2
    'NRL_DIG2 = Right(11 - NRL_SOMA Mod 11, 1)
    NRL_DIG2 = 11 - NRL_SOMA Mod 11
    If NRL_DIG2 = 10 Or NRL_DIG2 = 11 Then
        NRL_DIG2 = 0
    End If
    Verifica_CGC = False
    
    If Right(VLL_CGC, 2) = NRL_DIG1 & NRL_DIG2 Then
        Verifica_CGC = True
    End If
    Application.Calculation = xlCalculationAutomatic
End Function
Function Verifica_CPF(CPF As String) As Boolean
         
         Dim Soma As Integer
         Dim Resto As Integer
         Dim i As Integer
         Dim CPFsInvalido(1 To 10)
         If Len(CPF) > 11 Then
            Verifica_CPF = False
            Exit Function
         End If
         
         For i = 1 To 10
             CPFsInvalido(i) = String(11, i + 47)
         Next i
         CPF = Format(CPF, "00000000000")
         For i = 1 To Len(Trim(CPF))
             If Not IsNumeric(Mid$(CPF, i, 1)) Then
                Verifica_CPF = False
                Exit Function
             End If
         Next i
         For i = 1 To 10
             If CPF = CPFsInvalido(i) Then
                Verifica_CPF = False
                Exit Function
             End If
         Next i

         Soma = 0
         For i = 1 To 9
             Soma = Soma + Val(Mid$(CPF, i, 1)) * (11 - i)
         Next i
         Resto = 11 - (Soma - (Int(Soma / 11) * 11))
         If Resto = 10 Or Resto = 11 Then Resto = 0
         If Resto <> Val(Mid$(CPF, 10, 1)) Then
            Verifica_CPF = False
            Exit Function
         End If
                
         Soma = 0
         For i = 1 To 10
             Soma = Soma + Val(Mid$(CPF, i, 1)) * (12 - i)
         Next i
         Resto = 11 - (Soma - (Int(Soma / 11) * 11))
         If Resto = 10 Or Resto = 11 Then Resto = 0
         If Resto <> Val(Mid$(CPF, 11, 1)) Then
            Verifica_CPF = False
            Exit Function
         End If
            
         Verifica_CPF = True
         Application.Calculation = xlCalculationAutomatic
End Function
Function CRC_Cadastro_Obrigatorio() As Long
         'faz a validação dos dados do cadastro
         Dim lngLinBD As Long, lngColBD As Long, lngQtdErros As Long
         Dim StrNome As String, strMsgCritica As String, strRemessa As String, strCPF As String
         Dim lngColErr As Long, lngLinErr As Long
         Dim protPlan As clsProtecao                'incidente GSOL00944602 - corrigido em 09/2015 - RNM
         Set protPlan = New clsProtecao             'incidente GSOL00944602 - corrigido em 09/2015 - RNM
         
         strMsgCritica = ""
         lngQtdErros = 0
         
         Sheets("Visao").Activate                    'incidente GSOL00944602 - corrigido em 09/2015 - RNM
         protPlan.IniciaRotina False                 'incidente GSOL00944602 - corrigido em 09/2015 - RNM
         xl00Visao.Range("visaoINC_CAD").ClearContents
         Sheets("Cliente").Activate
         strCPF = Format(Range("E15").Value, "000000000-00")
         StrNome = Range("E13").Value
         lngLinErr = 12
         lngColErr = 184                             'incidente GSOL00944602 - corrigido em 09/2015 - RNM
         For lngLinBD = 13 To 97
             If Range("Z" & [lngLinBD]) = 1 And _
                Range("Y" & [lngLinBD]) = "-1" Then
                
                If lngLinBD >= 42 Then strMsgCritica = "Endereço Atividade -> "
                If lngLinBD >= 56 Then strMsgCritica = "Endereço Correspondência -> "
                If lngLinBD >= 69 Then strMsgCritica = "Dados do Imóvel -> "
                If lngLinBD >= 80 Then strMsgCritica = "Dados do Cônjuge -> "
                
                xl00Visao.Cells(lngLinErr, lngColErr).Value = strMsgCritica & Range("D" & [lngLinBD]).Value
                xl00Visao.Cells(lngLinErr, lngColErr + 1).Value = lngLinBD
                lngQtdErros = lngQtdErros + 1
                lngLinErr = lngLinErr + 1
             End If
         Next lngLinBD
         If lngQtdErros > 0 Then _
            ActiveWorkbook.Names.Add Name:="visaoINC_CAD", RefersToR1C1:= _
                      "=VISAO!R12C184:R" & lngLinErr - 1 & "C185"   'incidente GSOL00944602 - corrigido em 09/2015 - RNM
         CRC_Cadastro_Obrigatorio = lngQtdErros
         Sheets("Visao").Activate
         protPlan.ProtegePlanilha
End Function


Function CriticaProjeto() As Boolean
         CriticaProjeto = False
         Dim lngLogErr As Long
         Dim intLinCel As Integer, intErro As Integer, intCarencia As Integer, intLinCelC As Integer, intColCel As Integer
         Dim strMsg As String, strMsgErro As String, xlPlanAtual As String, strMsgEmpr As String
         
         Dim dblPercMax As Double
         Dim protPlan As clsProtecao
         Dim erroFATAL As Boolean  'GSOL00969220 - RNM INI COORDENADAS GEODÉSICAS
         
         Set protPlan = New clsProtecao
         lngMsgAvisos = 0
         lngMsgErros = 0
         intErro = 0
         lngLogErr = 0
         
         Calculate
         protPlan.IniciaRotina False
         strMsgErro = " inválido ou não informado, "
         xlPlanAtual = ActiveSheet.Name
         
         Call InserirResumoGleba
         Call OrdenarResumoGleba
         
         xl00Critica.Activate
         Calculate
         protPlan.DesprotegePlanilha
         Range("B12:E1000").Font.Bold = False
         Range("B12:E1000").ClearContents
         
         
        'COORDENADAS GEODESICAS  RNM - GSOL00969220 25/01/2016
        'Início da crítica
        Dim Str_Glb_Fto As String
        Dim Str_Pts As String
        Dim Str_Empree_Obrig As String

        Dim StrInv_Ant, StrGlb_Ant As String

        Dim Str_Glb_Ausencia As String
        Dim Str_Empreed_Ausencia As String
        Dim Str_Inv_Ausencia As String

        Dim Icont  As Byte
        Dim Icont_2, Icont_3, Icont_4 As Byte
        
        
        Call CargaIniGeodesica
        
        'Controla as linhas para não duplicar os erros
        StrInv_Ant = ""
        StrGlb_Ant = ""
        'Sprint 11 04/2017 - Atualização do Progresso da Crítica
        Application.StatusBar = "Executando crítica do Projeto 10%"
        
        'Forçar atualização da tela de coordenada Geodésica
        'xlPlanAtual = ActiveSheet.Name
        Application.ScreenUpdating = False
        bd10Geodesica.Activate
        AtualizaTela 1
        Application.ScreenUpdating = False
        bd10Geodesica.Visible = xlSheetVeryHidden
        bd10Geodesica.Calculate
        xl00Visao.Calculate
        CarregamentoRapido True
        xl00Visao.Activate
        Sheets(xlPlanAtual).Activate
        For lngLinSel = 11 To 46
            If (xl00Visao.Range("GW" & [lngLinSel]).Value = -1) And (xl00Visao.Range("GZ" & [lngLinSel]).Value = -1) And (xl00Visao.Range("HB" & [lngLinSel]).Value = 1) Then 'Não possui Glebas para o nome da inversão
                Icont = Icont + 1 ' Controle para imprimir espaço entre as linhas
                If (xl00Visao.Range("GO" & [lngLinSel]).Value <> StrInv_Ant) Or _
                   (xl00Visao.Range("GP" & [lngLinSel]).Value <> StrGlb_Ant) Then
                  If Icont = 1 Then
                     Str_Glb_Ausencia = Str_Glb_Ausencia & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " ( " & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " )"
                  Else
                     Str_Glb_Ausencia = Str_Glb_Ausencia & Chr(10) & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " ( " & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " )"
                  End If
                End If
                StrInv_Ant = xl00Visao.Range("GO" & [lngLinSel]).Value
                StrGlb_Ant = xl00Visao.Range("GP" & [lngLinSel]).Value
            End If
        Next lngLinSel
        
        
        Icont = 0
        
        StrInv_Ant = ""
        StrGlb_Ant = ""
                
        For lngLinSel = 11 To 46
            If (xl00Visao.Range("GX" & [lngLinSel]).Value = -1) And (xl00Visao.Range("GZ" & [lngLinSel]).Value = -1) And (xl00Visao.Range("HB" & [lngLinSel]).Value = 1) Then 'Possui inversão mais não possui Glebas
                Icont = Icont + 1 ' Controle para imprimir espaço entre as linhas
                If (xl00Visao.Range("GO" & [lngLinSel]).Value <> StrInv_Ant) Or _
                   (xl00Visao.Range("GP" & [lngLinSel]).Value <> StrGlb_Ant) Then
                    If Icont = 1 Then
                       Str_Inv_Ausencia = Str_Inv_Ausencia & xl00Visao.Range("GO" & [lngLinSel]).Value & " ( " & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " )"
                    Else
                       Str_Inv_Ausencia = Str_Inv_Ausencia & Chr(10) & xl00Visao.Range("GO" & [lngLinSel]).Value & " ( " & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " )"
                    End If
                End If
                StrInv_Ant = xl00Visao.Range("GO" & [lngLinSel]).Value
                StrGlb_Ant = xl00Visao.Range("GP" & [lngLinSel]).Value
            End If
        Next lngLinSel
        
        

        Icont = 0

        StrInv_Ant = ""
        StrGlb_Ant = ""
        
'        For lngLinSel = 11 To 46
'            If xl00Visao.Range("GZ" & [lngLinSel]).Value = -1 And (xl00Visao.Range("HB" & [lngLinSel]).Value = 1) Then  'Empreendimento exige que tenha Glebas
'                Icont = Icont + 1 ' Controle para imprimir espaço entre as linhas
'                If (xl00Visao.Range("GO" & [lngLinSel]).Value <> StrInv_Ant) Or _
'                   (xl00Visao.Range("GP" & [lngLinSel]).Value <> StrGlb_Ant) Then
'                    If Icont = 1 Then
'                       Str_Empree_Obrig = Str_Empree_Obrig & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " ( " & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " )"
'                    Else
'                       Str_Empree_Obrig = Str_Empree_Obrig & Chr(10) & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " ( " & xl00Visao.Range("GO" & [lngLinSel]).Value & " - " & xl00Visao.Range("GP" & [lngLinSel]).Value & " )"
'                    End If
'                End If
'                StrInv_Ant = xl00Visao.Range("GO" & [lngLinSel]).Value
'                StrGlb_Ant = xl00Visao.Range("GP" & [lngLinSel]).Value
'            End If
'        Next lngLinSel

        Icont = 0

        StrInv_Ant = ""
        StrGlb_Ant = ""

'        For lngLinSel = 101 To bd10Geodesica.Range("B99").Value + 100  ' Identificar quantidade de pontos incompativeis com o limite estabelecido pelo FORMATO DA GLEBA
'            If bd10Geodesica.Range("S" & [lngLinSel]).Value = -1 Then
'                Icont = Icont + 1
'                If (bd10Geodesica.Range("C" & [lngLinSel]).Value <> StrInv_Ant) Or _
'                   (bd10Geodesica.Range("F" & [lngLinSel]).Value <> StrGlb_Ant) Then
'                    If Icont = 1 Then
'                       Str_Glb_Fto = Str_Glb_Fto & bd10Geodesica.Range("F" & [lngLinSel]).Value & " / Pontos - " & bd10Geodesica.Range("I" & [lngLinSel]).Value & " Formato - " & bd10Geodesica.Range("G" & [lngLinSel]).Value & " \ Inversão - " & bd10Geodesica.Range("C" & [lngLinSel]).Value
'                    Else
'                       Str_Glb_Fto = Str_Glb_Fto & Chr(10) & bd10Geodesica.Range("F" & [lngLinSel]).Value & " / Pontos - " & bd10Geodesica.Range("I" & [lngLinSel]).Value & " Formato - " & bd10Geodesica.Range("G" & [lngLinSel]).Value & " \ Inversão - " & bd10Geodesica.Range("C" & [lngLinSel]).Value
'                    End If
'                End If
'                StrInv_Ant = bd10Geodesica.Range("C" & [lngLinSel]).Value
'                StrGlb_Ant = bd10Geodesica.Range("F" & [lngLinSel]).Value
'            End If
'        Next lngLinSel
        
        Icont_2 = 0
        Icont_3 = 0
        Icont_4 = 0

        StrInv_Ant = ""
        StrGlb_Ant = ""
        
'        For lngLinSel = 101 To bd10Geodesica.Range("B99").Value + 100  ' Identificar quantidade de pontos incompativeis com o limite estabelecido pelo FORMATO DA GLEBA
'            ' Fora do Range estabelecido para Latitude
'            If (bd10Geodesica.Range("J" & [lngLinSel]).Value < -33 Or bd10Geodesica.Range("J" & [lngLinSel]).Value > 5) Then
'                Icont_2 = Icont_2 + 1
'                If (bd10Geodesica.Range("C" & [lngLinSel]).Value <> StrInv_Ant) Or _
'                   (bd10Geodesica.Range("F" & [lngLinSel]).Value <> StrGlb_Ant) Then
'                    If Icont_2 = 1 Then
'                       Str_Pts = Str_Pts & bd10Geodesica.Range("F" & [lngLinSel]).Value & " / Pontos - " & bd10Geodesica.Range("I" & [lngLinSel]).Value & " \ Inversão - " & bd10Geodesica.Range("C" & [lngLinSel]).Value & " - Latitude "
'                    Else
'                       Str_Pts = Str_Pts & Chr(10) & bd10Geodesica.Range("F" & [lngLinSel]).Value & " / Pontos - " & bd10Geodesica.Range("I" & [lngLinSel]).Value & " \ Inversão - " & bd10Geodesica.Range("C" & [lngLinSel]).Value & " - Latitude "
'                    End If
'                End If
'                StrInv_Ant = bd10Geodesica.Range("C" & [lngLinSel]).Value
'                StrGlb_Ant = bd10Geodesica.Range("F" & [lngLinSel]).Value
'            End If
'            ' Fora do Range estabelecido para Longitude
'            If (bd10Geodesica.Range("K" & [lngLinSel]).Value < -74 Or bd10Geodesica.Range("K" & [lngLinSel]).Value > -33) Then
'                If (bd10Geodesica.Range("C" & [lngLinSel]).Value <> StrInv_Ant) Or _
'                   (bd10Geodesica.Range("F" & [lngLinSel]).Value <> StrGlb_Ant) Then
'                    Icont_3 = Icont_3 + 1
'                    If Icont_3 = 1 Then
'                       Str_Pts = Str_Pts & bd10Geodesica.Range("F" & [lngLinSel]).Value & " / Pontos - " & bd10Geodesica.Range("I" & [lngLinSel]).Value & " \ Inversão - " & bd10Geodesica.Range("C" & [lngLinSel]).Value & " - Longitude "
'                    Else
'                       Str_Pts = Str_Pts & Chr(10) & bd10Geodesica.Range("F" & [lngLinSel]).Value & " / Pontos - " & bd10Geodesica.Range("I" & [lngLinSel]).Value & " \ Inversão - " & bd10Geodesica.Range("C" & [lngLinSel]).Value & " - Longitude "
'                    End If
'                End If
'                StrInv_Ant = bd10Geodesica.Range("C" & [lngLinSel]).Value
'                StrGlb_Ant = bd10Geodesica.Range("F" & [lngLinSel]).Value
'            End If
'            ' Fora do Range estabelecido para Altitude
'            If (bd10Geodesica.Range("L" & [lngLinSel]).Value < -100 Or bd10Geodesica.Range("L" & [lngLinSel]).Value > 3000) Then
'                If (bd10Geodesica.Range("C" & [lngLinSel]).Value <> StrInv_Ant) Or _
'                   (bd10Geodesica.Range("F" & [lngLinSel]).Value <> StrGlb_Ant) Then
'
'                    Icont_4 = Icont_4 + 1
'                    If Icont_4 = 1 Then
'                       Str_Pts = Str_Pts & bd10Geodesica.Range("F" & [lngLinSel]).Value & " / Pontos - " & bd10Geodesica.Range("I" & [lngLinSel]).Value & " \ Inversão - " & bd10Geodesica.Range("C" & [lngLinSel]).Value & " - Altitude "
'                    Else
'                       Str_Pts = Str_Pts & Chr(10) & bd10Geodesica.Range("F" & [lngLinSel]).Value & " / Pontos - " & bd10Geodesica.Range("I" & [lngLinSel]).Value & " \ Inversão - " & bd10Geodesica.Range("C" & [lngLinSel]).Value & " - Altitude "
'                    End If
'                End If
'                StrInv_Ant = bd10Geodesica.Range("C" & [lngLinSel]).Value
'                StrGlb_Ant = bd10Geodesica.Range("F" & [lngLinSel]).Value
'            End If
'
'        Next lngLinSel

'        If Str_Glb_Ausencia <> vbNullString Then
''              strMsg = strMsg & "- {ERRO} (Geodésicas) A(s) Inversão(ões) " & Chr(10) _
''              & Str_Glb_Ausencia _
''              & " , não apresenta(m) as informações referentes às Coordenadas Geodésicas." & Chr(10)
''              '& " , da janela 'Coordenadas Geodésicas' deverá(ão) ser preenchido(s), em virtude do valor financiado do item." & Chr(10)
''              lngMsgErros = lngMsgErros + 1
''              intErro = intErro + 1
'              erroFATAL = True
'        End If

       'Sprint 11 04/2017 - Atualização do Progresso da Crítica
        Application.StatusBar = "Executando crítica do Projeto 25%"

'        If CDate(xl00Visao.Range("GN8").Value) >= CDate("01/07/2016") Then
'
'          If Str_Glb_Ausencia = vbNullString And xl03Prop.Range("valorFIN").Value > 40000 Then
'                strMsg = strMsg & "{ERRO} - (Geodésicas) - O(s) item(ns) de inversão " & Chr(10) _
'                & Str_Glb_Ausencia & ", da janela 'Coordenadas Geodésicas' deverá(ão) ser preenchido(s), em virtude do valor do projeto." & Chr(10)
'                lngMsgErros = lngMsgErros + 1
'                intErro = intErro + 1
'                erroFATAL = True
'          End If
'
'
'        ElseIf CDate(xl00Visao.Range("GN8").Value) >= CDate("01/01/2016") Then
'          If Str_Glb_Ausencia <> vbNullString And xl03Prop.Range("valorFIN").Value > 300000 Then
'                strMsg = strMsg & "{ERRO} - (Geodésicas) - O(s) item(ns) de inversão " & Chr(10) _
'                & Str_Glb_Ausencia & " , da janela 'Coordenadas Geodésicas' deverá(ão) ser preenchido(s), em virtude do valor do projeto." & Chr(10)
'                lngMsgErros = lngMsgErros + 1
'                intErro = intErro + 1
'                erroFATAL = True
'          End If
'
'        End If

'        If (Str_Empree_Obrig <> vbNullString) And (Str_Glb_Ausencia <> vbNullString) Then
'             If (erroFATAL) Then
'               strMsg = strMsg & "- {ERRO} "
'               lngMsgErros = lngMsgErros + 1
'               intErro = intErro + 1
'               erroFATAL = True
'             Else
'               strMsg = strMsg & "- {AVISO} "
'               lngMsgAvisos = lngMsgAvisos + 1
'             End If
'             strMsg = strMsg & "(Geodésicas) - O(s) item(ns) de inversão " & Chr(10) _
'             & Str_Glb_Ausencia & " não apresenta(m) as informações referentes às coordenadas geodésicas." & Chr(10)
'        End If
'
'        If Str_Inv_Ausencia <> vbNullString Then
'             strMsg = strMsg & "- {ERRO} (Geodésicas) - O(s) item(ns) de inversão  " & Chr(10) _
'             & Str_Inv_Ausencia & " apresenta(m) as informações referentes às coordenadas geodésicas." & Chr(10)
'             lngMsgErros = lngMsgErros + 1
'             intErro = intErro + 1
'             erroFATAL = True
'        End If
'
'
'        If Str_Glb_Fto <> vbNullString Then   ' Formato da Gleba e a quantidade de pontos
'              strMsg = strMsg & "- {ERRO} (Geodésicas) - A(s) Gleba(s)" & Chr(10) _
'                  & Str_Glb_Fto & ", da janela 'Coordenadas Geodésicas' não apresenta(m) a quantidade mínima de pontos compatível com o(s) formato(s) informado(s)." & Chr(10)
'              lngMsgErros = lngMsgErros + 1
'              intErro = intErro + 1
'              If Str_Empree_Obrig <> vbNullString Then
'                   erroFATAL = True
'              End If
'        End If
'        If Str_Pts <> vbNullString Then
'          strMsg = strMsg & "- {ERRO} (Geodésicas) - As(s) Gleba(s) - Pontos(s) " & Chr(10) _
'                  & Str_Pts & ", da janela 'Coordenadas Geodésicas', não está(ão) no formato e/ou limite compatível(is)." & Chr(10)
'          lngMsgErros = lngMsgErros + 1
'          intErro = intErro + 1
'          erroFATAL = True
'        End If
        
        '20170119 - GSOL01040239  Ajuste de critica de área não cultivada INI
'        Dim StrInv As String
'        Dim IntInv As Integer
'        Dim IntGleba As Integer
'        Dim DBAreaNaoCult As Double
'        Dim FlagProxGleba As Boolean
'        Dim invIni As Integer
'        Dim invLinItem As Integer
'        Dim StrInverDesc As String
'        FlagProxGleba = True
'        StrInv = vbNullString
'        invIni = 0
'
'        For lngLinSel = 101 To bd10Geodesica.Range("BJ99").Value + 100 'bd10Geodesica.Range("BA101").End(xlDown).Row
'
'            'Quantidade de Pontos por Gleba
'           If bd10Geodesica.Range("BA" & lngLinSel).Value > 60 Then
'                StrInv = bd10Geodesica.Range("BA" & lngLinSel).Value
'                strMsgCritica = strMsgCritica & " - {ERRO}{Geodésicas}  O(s) item(ns) de inversão " & StrInv & " da Gleba " & bd10Geodesica.Range("BB" & lngLinSel).Value & " ultrapassa o limite de 60 pontos por Gleba." & Chr(10)
'                preencherLinhaCritica "Geodesicas", strMsgCritica & ". "
'                strMsgCritica = vbNullString
'                lngErro = lngErro + 1
'                erroFATAL = True
'           End If
'           If lngLinSel - 100 <= bd10Geodesica.Range("BJ99").Value Then
'                    'GSOL01923494 item 3 - Crítica de quantidade de pontos incompativeis com o limite estabelecido pelo FORMATO DA GLEBA rnm 26/12/2018
'                    If bd10Geodesica.Range("BQ" & [lngLinSel]).Value = -1 Then
'                        For invLinItem = 1 To bd10Geodesica.Range("A1").End(xlDown).Row
'                            If bd10Geodesica.Range("BA" & [lngLinSel]).Value = bd10Geodesica.Range("A" & invLinItem + 1).Value Then
'                                StrInverDesc = bd10Geodesica.Range("B" & invLinItem + 1).Value
'                            End If
'                        Next invLinItem
'                        ' Formato da Gleba e a quantidade de pontos
'                        If bd10Geodesica.Range("BA" & [lngLinSel]).Value <> invIni Then
'                           strMsgCritica = strMsgCritica & "{ERRO} - O item de inversão " & Format(bd10Geodesica.Range("BA" & lngLinSel).Value, "00") & ", " & StrInverDesc & _
'                           ", da janela 'Coordenadas Geodésicas' não apresenta(m) a quantidade mínima de pontos compatível com o(s) formato(s) informado(s)."
'                           lngMsgErros = lngMsgErros + 1
'                           preencherLinhaCritica "Geodésicas", strMsgCritica & ". "
'                           strMsgCritica = vbNullString
'                           lngErro = lngErro + 1
'                           invIni = False
'                        End If
'                   End If
'                   'GSOL01923494 item 3 - Crítica de quantidade de pontos incompativeis com o limite estabelecido pelo FORMATO DA GLEBA rnm 26/12/2018
'                   If (bd10Geodesica.Range("BP" & lngLinSel).Value < -0.1 Or bd10Geodesica.Range("BP" & lngLinSel).Value > 0.1) And bd10Geodesica.Range("BM" & lngLinSel).Value > 1 Then
'                       For invLinItem = 1 To bd10Geodesica.Range("A1").End(xlDown).Row
'                             If bd10Geodesica.Range("BA" & [lngLinSel]).Value = bd10Geodesica.Range("A" & invLinItem + 1).Value Then
'                                 StrInverDesc = bd10Geodesica.Range("B" & invLinItem + 1).Value
'                             End If
'                       Next invLinItem
'
'                       If bd10Geodesica.Range("BA" & [lngLinSel]).Value <> invIni Then
'                           strMsgCritica = strMsgCritica & "{ERRO} - O item de inversão " & Format(bd10Geodesica.Range("BA" & lngLinSel).Value, "00") & ", " & StrInverDesc & _
'                           ", possui o percentual da diferença entre a Área Financiada e a Área da(s) Gleba(s), em relação à Área Financiada, fora dos parâmetros determinados pelo Banco Central do Brasil." & Chr(10)
'                           preencherLinhaCritica "Geodésicas", strMsgCritica & ". "
'                           strMsgCritica = vbNullString
'                           lngErro = lngErro + 1
'                           erroFATAL = True
'                           invIni = False
'                       End If
'
'                       If bd10Geodesica.Range("BJ" & lngLinSel).Value > bd10Geodesica.Range("BI" & lngLinSel).Value Then
'                          strMsgCritica = strMsgCritica & " - {ERRO} - A Gleba " & Format(bd10Geodesica.Range("BB" & lngLinSel).Value, "00") & _
'                           " do item de inversão " & Format(bd10Geodesica.Range("BA" & lngLinSel).Value, "00") & ", " & StrInverDesc & _
'                           ", possui Área Cultivada maior que Área Financiada." & Chr(10)
'                           preencherLinhaCritica "Geodésicas", strMsgCritica & ". "
'                           strMsgCritica = vbNullString
'                           lngErro = lngErro + 1
'                           erroFATAL = True
'                       End If
'
'                   End If
'
'                   invIni = bd10Geodesica.Range("BA" & [lngLinSel]).Value
'
'                   If bd10Geodesica.Range("BD" & lngLinSel).Value < 0 Then
'                       strMsgCritica = strMsgCritica & " - {ERRO} - A Gleba " & Format(bd10Geodesica.Range("BB" & lngLinSel).Value, "00") & _
'                        " do item de inversão " & Format(bd10Geodesica.Range("BA" & lngLinSel).Value, "00") & " possui Área Não Cultivada com valor negativo." & Chr(10)
'                       preencherLinhaCritica "Geodésicas", strMsgCritica & ". "
'                       strMsgCritica = vbNullString
'                       lngErro = lngErro + 1
'                       erroFATAL = True
'                   End If
'
'           End If
'           If bd10Geodesica.Range("BN" & lngLinSel).Value <> vbNullString And bd10Geodesica.Range("BN" & lngLinSel).Value = 0 Then
'                StrInv = bd10Geodesica.Range("BA" & lngLinSel).Value
'                strMsgCritica = strMsgCritica & " - {ERRO}{Geodésicas} A Gleba " & Format(bd10Geodesica.Range("BB" & lngLinSel).Value, "00") & _
'                     " do item de inversão " & Format(bd10Geodesica.Range("BA" & lngLinSel).Value, "00") & " possui o formato da Gleba inválido." & Chr(10)
'                preencherLinhaCritica "Geodesicas", strMsgCritica & ". "
'                strMsgCritica = vbNullString
'                lngErro = lngErro + 1
'                erroFATAL = True
'
'           End If
'
'        Next lngLinSel
'
'        'GSOL01923494 item 3 - Crítica de quantidade de pontos incompativeis com o limite estabelecido pelo FORMATO DA GLEBA rnm 26/12/2018
'        If bd10Geodesica.Range("B99").Value > 4090 Then
'              strMsgCritica = strMsgCritica & "{ERRO} - A quantidade de pontos informada [(Total de Pontos de todas as glebas)] excede o limite permitido pelo BACEN (4.090)."
'              preencherLinhaCritica "Geodésicas", strMsgCritica & ". "
'              strMsgCritica = vbNullString
'              lngMsgErros = lngMsgErros + 1
'              lngErro = lngErro + 1
'              erroFATAL = True
'        End If
'        'GSOL01923494 item 3 - Crítica de quantidade de pontos incompativeis com o limite estabelecido pelo FORMATO DA GLEBA rnm 26/12/2018
'
        

        '20170119 - GSOL01040239  Ajuste de critica de área não cultivada - FIM
        
        'Sprint 11 04/2017 - Atualização do Progresso da Crítica        ini
'        Application.StatusBar = "Executando crítica do Projeto 50%"
'        'Sprint 11 04/2017 - Crítica de diferênça entre área financiada e capturada INI
'        Dim SQInv As Integer
'        Dim SQInv_Fin As Double
'        Dim SQInv_Cap As Double
'        Dim SQInv_Margem As Double
'        SQInv = bd10Geodesica.Range("BA101").Value
'        SQInv_Fin = bd10Geodesica.Range("BI101").Value
'        SQInv_Cap = bd10Geodesica.Range("BK101").Value
'        For lngLinSel = 101 To bd10Geodesica.Range("B99").Value + 100
'           If bd10Geodesica.Range("BA" & [lngLinSel]).Value <> SQInv Then
'              SQInv_Margem = (1 - (SQInv_Cap / SQInv_Fin)) * 100
'              If SQInv_Margem > 10 Or SQInv_Margem < -10 Then
'                 strMsg = strMsg & " - {ERRO} - (Geodésicas) A Inversão " & Format(SQInv, "00") & " ultrapassa o (%) de diferênça entre Área (Financiada x Cultivada), " & _
'                                   " estabelecida pelo Banco Central ( " & Format(SQInv_Margem, "#,#00.00") & "% )" & Chr(10)
'                 lngMsgErros = lngMsgErros + 1
'                 intErro = intErro + 1
'                 erroFATAL = True
'              End If
'              SQInv = bd10Geodesica.Range("BA" & [lngLinSel]).Value
'              SQInv_Fin = bd10Geodesica.Range("BI" & [lngLinSel]).Value
'              SQInv_Cap = bd10Geodesica.Range("BK" & [lngLinSel]).Value
'           End If
'        Next lngLinSel
        'Sprint 11 04/2017 - Crítica de diferênça entre área financiada e capturada INI
 
        If intErro > 0 Or lngMsgAvisos > 0 Then
           preencherLinhaCritica "Informações Gerais", strMsg & ". "
           strMsg = vbNullString
        End If
                
        'Término da validação da Coordenada Geodésica
        'COORDENADAS GEODESICAS  RNM - GSOL00969220 25/01/2016
        'SICOR - INI RNM
        Application.StatusBar = "Executando crítica do Projeto 50%"
        CarregamentoRapido True
        strMsgCritica = vbNullString
        
        '' retirado dia 01.04.2026 - critica do SICOR
        '' JORIS BANE
        
        
      ''  Dim lin As Integer
      ''  lin = 7
      ''  While lin < 867
        ''    If xlSicor.Range("A" & [lin]).Value = "A" And xlSicor.Range("X" & [lin]).Value <> "" Then
          ''    If xlSicor.Range("Y" & [lin]).Value = -1 Then
            ''    strMsgCritica = strMsgCritica & "{Aviso} - O Código de Certif. Orgânica do item ( " & xlSicor.Range("X" & [lin]).Value & " ) deve conter 80 caracteres."
              '  preencherLinhaCritica "SICOR - ", strMsgCritica & ". "
               ' strMsgCritica = vbNullString
               ' lngMsgAvisos = lngMsgAvisos + 1
 '             End If
                
  '            If xlSicor.Range("Z" & [lin]).Value = -1 Then
   '             strMsgCritica = strMsgCritica & "{Aviso} - A URL da Certif. Orgânica do item ( " & xlSicor.Range("X" & [lin]).Value & " ) esta inválida."
    '            preencherLinhaCritica "SICOR - ", strMsgCritica & ". "
     '           strMsgCritica = vbNullString
      '          lngMsgAvisos = lngMsgAvisos + 1
       '       End If
                
        '      If xlSicor.Range("AA" & [lin]).Value = -1 Then
         '       strMsgCritica = strMsgCritica & "{Aviso} - O Cód. de Rastreabilidade do item ( " & xlSicor.Range("X" & [lin]).Value & " ) deve conter 80 caracteres."
             '   preencherLinhaCritica "SICOR - ", strMsgCritica & ". "
          '      strMsgCritica = vbNullString
           '     lngMsgAvisos = lngMsgAvisos + 1
            '  End If
                
 '             If xlSicor.Range("AB" & [lin]).Value = -1 Then
  '              strMsgCritica = strMsgCritica & "{Aviso} - A URL da Certif. de Rastreabilidade do item ( " & xlSicor.Range("X" & [lin]).Value & " )  esta inválida."
   '             preencherLinhaCritica "SICOR - ", strMsgCritica & ". "
    '            strMsgCritica = vbNullString
     ''           lngMsgAvisos = lngMsgAvisos + 1
       '       End If
        '    End If
        
         '   lin = lin + 1
  '
   '     Wend
        'SICOR - INI RNM

         
'-Criticas guia VISAO
         xl00Visao.Activate
         protPlan.DesprotegePlanilha
         xl00Visao.Range("visaoCRITICA").Select
         intLin = ActiveCell.Row
         
         'Sprint 11 04/2017 - Atualização do Progresso
         Application.StatusBar = "Executando crítica do Projeto 60%"
         
         For intLinCel = intLin To xl00Visao.Range("visaoCRITICA").Rows.Count + 12
                      
             If ActiveCell.Offset(0, 2).Value = "-1" Then
             'If Range("EF" & [intLinCel]).Value = "-1" Then
                strMsg = ActiveCell.Value
                If ActiveCell.Offset(0, 3).Value = "2" Then
                   intErro = intErro + 1
                   lngMsgErros = lngMsgErros + 1
                Else
                   lngMsgAvisos = lngMsgAvisos + 1
                End If
                preencherLinhaCritica "Informações Gerais", strMsg
             End If
             ActiveCell.Offset(1, 0).Select
             
         'Sprint 11 04/2017 - Atualização do Progresso
         Application.StatusBar = "Executando crítica do Projeto 65%"
             
             'GSOL00126275 If intLinCel = 23 Then 'complemento critica proposta
             If intLinCel = 24 Then 'complemento critica proposta
                'imóvel vinculado
                For intLinCelC = 27 To 62
                    xl00Visao.Range("EE23").Value = intLinCelC 'GSOL00126275 EE22
                    Calculate
                    If xl00Visao.Range("EF23").Value = -1 Then 'GSOL00126275 EF22
                       intErro = intErro + 1
                       strMsg = xl00Visao.Range("ED23").Value 'GSOL00126275 ED22
                       preencherLinhaCritica "", strMsg
                       lngMsgErros = lngMsgErros + 1
                    End If
                Next intLinCelC
                xl00Visao.Range("EE23").Value = 1 'GSOL00126275 EE22
             End If
             
         'Sprint 11 04/2017 - Atualização do Progresso
          Application.StatusBar = "Executando crítica do Projeto 70%"
             
             'GSOL00126275 If intLinCel = 27 Then 'complemento critica empreendimento
             If intLinCel = 28 Then 'complemento critica empreendimento
                For intLinCelC = 202 To 240
                    xl00Visao.Range("EE27").Value = intLinCelC 'GSOL00126275 EE26
                    Calculate
                    If xl00Visao.Range("EF27").Value = -1 Then 'GSOL00126275 EF26
                       intErro = intErro + 1
                       strMsg = xl00Visao.Range("ED27").Value 'GSOL00126275 ED26
                       preencherLinhaCritica "", strMsg
                       lngMsgErros = lngMsgErros + 1
                    End If
                Next intLinCelC
                xl00Visao.Range("EE27").Value = 1 'GSOL00126275 EE26
             End If
             
         Next intLinCel
         protPlan.FinalizaRotina
         
         If intErro > 0 Then
             lngMsgErros = lngLogErr + intErro
             intErro = 0
             strMsg = vbNullString
         End If
         
         'Sprint 11 04/2017 - Atualização do Progresso
         Application.StatusBar = "Executando crítica do Projeto 75%"
         
'- Guia Cronograma
        
'        If Sheets(" Proposta").Range("V122").Value <> 164 Then
'           LogErro ("Formato de mês de desembolso inválido). Planilha Proposta (Cronograma de desembolso)")
'           lngLogErr = lngLogErr + 1
'        End If
         
'- Guia Atividade Agrícola
        
'- Guia Atividade Pecuária
         '-indic. bov. leite
         If xl06AtivPec.Range("Z26").Value = -1 Then
            For intLinCel = 27 To 33
                If xl06AtivPec.Range("Z" & [intLinCel]).Value = -1 Then
                   intErro = intErro + 1
                   strMsg = strMsg & "Indicador de " & _
                                     xl06AtivPec.Range("AA" & [intLinCel]).Value & _
                                     " na atividade " & xl06AtivPec.Range("AA26").Value & _
                                     " está fora dos parâmetros permitidos (Mínimo: " & _
                                     Left(xl06AtivPec.Range("Y" & [intLinCel]).Value, 3) & " - Máximo: " & _
                                     Right(xl06AtivPec.Range("Y" & [intLinCel]).Value, 3) & "). "
                End If
            Next intLinCel
         End If
         
         '-indic. bov. corte
         If xl06AtivPec.Range("Z47").Value = -1 Then
            For intLinCel = 48 To 52
                If xl06AtivPec.Range("Z" & [intLinCel]).Value = -1 Then
                   intErro = intErro + 1
                   strMsg = strMsg & "Indicador de " & _
                                     xl06AtivPec.Range("AA" & [intLinCel]).Value & _
                                     " na atividade " & xl06AtivPec.Range("AA47").Value & _
                                     " está fora dos parâmetros permitidos (Mínimo: " & _
                                     Left(xl06AtivPec.Range("Y" & [intLinCel]).Value, 3) & " - Máximo: " & _
                                     Right(xl06AtivPec.Range("Y" & [intLinCel]).Value, 3) & "). "
                End If
            Next intLinCel
         End If
         
         '-indic. ovino
         If xl06AtivPec.Range("Z62").Value = -1 Then
            For intLinCel = 63 To 69
                If xl06AtivPec.Range("Z" & [intLinCel]).Value = -1 Then
                   intErro = intErro + 1
                   strMsg = strMsg & "Indicador de " & _
                                     xl06AtivPec.Range("AA" & [intLinCel]).Value & _
                                     " na atividade " & xl06AtivPec.Range("AA62").Value & _
                                     " está fora dos parâmetros permitidos (Mínimo: " & _
                                     Left(xl06AtivPec.Range("Y" & [intLinCel]).Value, 3) & " - Máximo: " & _
                                     Right(xl06AtivPec.Range("Y" & [intLinCel]).Value, 3) & "). "
                End If
            Next intLinCel
         End If
         
         '-indic. caprino
         If xl06AtivPec.Range("Z78").Value = -1 Then
            For intLinCel = 79 To 88
                If xl06AtivPec.Range("Z" & [intLinCel]).Value = -1 Then
                   intErro = intErro + 1
                   strMsg = strMsg & "Indicador de " & _
                                     xl06AtivPec.Range("AA" & [intLinCel]).Value & _
                                     " na atividade " & xl06AtivPec.Range("AA78").Value & _
                                     " está fora dos parâmetros permitidos (Mínimo: " & _
                                     Left(xl06AtivPec.Range("Y" & [intLinCel]).Value, 3) & " - Máximo: " & _
                                     Right(xl06AtivPec.Range("Y" & [intLinCel]).Value, 3) & "). "
                End If
            Next intLinCel
         End If
         
         
         If intErro > 0 Then
            preencherLinhaCritica "", "{AVISO} - (Atividade Pecuária) - " & strMsg
            'lngLogErr = lngLogErr + intErro
            intErro = 0
            strMsg = vbNullString
            lngMsgAvisos = lngMsgAvisos + 1
         End If
         
      '- Guia Outras Atividades
        For lngLinCel = 15 To 23
            If xl07OutAtv.Range("X" & [lngLinCel]).Value = -1 Then
               intErro = intErro + 1
               strMsg = strMsg & "Não foram informados valores de receita para a atividade " & _
                        xl07OutAtv.Range("D" & [lngLinCel]).Value & ". "
            End If
            If xl07OutAtv.Range("X" & [lngLinCel] + 31).Value = -1 Then
               intErro = intErro + 1
               strMsg = strMsg & "Não foram informados valores de Custo / Despesa para a atividade " & _
                        xl07OutAtv.Range("D" & [lngLinCel]).Value & ". "
            End If
        Next lngLinCel
        
        'Ausência de empreendimento
        For intLinCel = 202 To 240
          'Ausência de empreendimento
          If xl04Crono.Range("B" & intLinCel).Value = -1 Or _
             (xl04Crono.Range("G" & intLinCel).Value <> 0 And xl04Crono.Range("J" & intLinCel).Value = vbNullString) Then
            lngMsgErros = lngMsgErros + 1
            intErro = intErro + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - O item de inversão ( " & xl04Crono.Range("D" & intLinCel).Value & " ) não possui um empreendimento válido. Favor selecionar o empreendimento na aba 'Cronograma'."
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
          End If
        Next intLinCel
        'GSOL00722222 - CRÍTICA DE UNIDADE RNM FIM
        
'        'GSOL01938006 - PLANILHAS-EXCLUIR A CRÍTICA DE PREENCHIMENTO OBRIGATÓRIO DOS CAMPOS MDA E CFI. 24082022 ini
'        'Ausência de Código MDA E CFI PARA INVERSÃO COM VALOR SUPERIOR A R$ 5.0000,00 e
'        'código de empreendimento de acordo com a tabela "Empreend_MDA_CFI".
'        'Inclusão do item MDA E CFI GSOL00800821 - RNM INI
'        Dim Emprend As String * 15
'        Dim modal, var, final As Integer
'
'        For intLinCel = 202 To 240
'          'Ausência de código MDA E CFI para o item de inversão
'
'          Emprend = xl04Crono.Range("Z" & intLinCel).Value
'          modal = Val(Mid(Emprend, 3, 2))
'          var = Val(Mid(Emprend, 10, 3))
'          final = Val(Mid(Emprend, 2, 1))
'
'          'DESABILITADO 23/06/2017 - PLANO SAFRA
'           'If xl04Crono.Range("G" & intLinCel).Value > 5000 And xl04Crono.Range("B" & intLinCel + 41).Value And _
'                  (xl04Crono.Range("L" & intLinCel + 41).Value = vbNullString Or xl04Crono.Range("M" & intLinCel + 41).Value = vbNullString) Then
'
'            If Emprend <> "" Then
'              If xl04Crono.Range("G" & intLinCel).Value > 10000 And (modal = 14 Or modal = 15) And var <> 780 And final = 3 _
'                 And (xl04Crono.Range("L" & intLinCel + 41).Value = vbNullString Or xl04Crono.Range("M" & intLinCel + 41).Value = vbNullString) Then
'                lngMsgErros = lngMsgErros + 1
'                intErro = intErro + 1
'                strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - O item de inversão ( " & _
'                xl04Crono.Range("D" & intLinCel).Value & " ) deverá possuir o código MDA e o código CFI do BNDES, para os empreendimentos (Máquinas, Equipamentos, Utensílios ou Aquisição de Veículos). Favor preencher."
'                preencherLinhaCritica "", strMsgEmpr
'                strMsgEmpr = vbNullString
'              End If
'            End If
'
'         Next intLinCel
'        'Inclusão do item MDA E CFI GSOL00800821 - RNM FIM
'        'GSOL01938006 - PLANILHAS-EXCLUIR A CRÍTICA DE PREENCHIMENTO OBRIGATÓRIO DOS CAMPOS MDA E CFI. 24082022 FIM
        
        'GSOL00722222 - CRÍTICA DE UNIDADE RNM INI
        'Total de 36 empreendimentos
       'INI para não permitir empreendimento com sist produção diferente.
       ' Solicitação 1026893 - Inclusão Código Sistema Produção
       
       '' inicio codificação para verifica se há empreendimento iguais com sistema de produção diferente.
       '' Joris  - Implemntado dia 02.06.2026
       
             'FIM para não permitir empreendimento com sist produção diferente.
       
'==========================================================
' JORIS - ANALISADOR
' CRÍTICA DE EMPREENDIMENTO X SISTEMA DE PRODUÇÃO
'
' REGRA:
' 1) Empreendimento igual + sistema de produção igual = OK
' 2) Empreendimento diferente = OK
' 3) Empreendimento igual + sistema de produção diferente = NÃO OK
'
' PLANILHA:
' xl04Crono
'
' DADOS:
' Z202:Z240   = Empreendimento BACEN
' AB202:AB240 = Sistema de Produção
' CC202:CC240 = Resultado da Crítica
' CH202       = Controle NGERAR
'==========================================================


    On Error GoTo TrataErro

    Dim ws As Worksheet
    Dim i As Long, j As Long
    Dim empreendimento As String
    Dim producao As String
    Dim empreendimentoComparado As String
    Dim producaoComparada As String
    Dim criticaNaoOK As Boolean
    Dim existeCriticaNaoOK As Boolean
   '' Dim strMsgEmpr As String
    Dim relatorioAberto As Boolean
    Dim valorCH202 As String

    Set ws = xl04Crono

    Application.ScreenUpdating = False
    Application.EnableEvents = False

   
    ws.Unprotect "senhasBNxl"
   ' ws.Range("CH202").Value = ""
    existeCriticaNaoOK = False
    relatorioAberto = False

    ws.Range("CC202:CC240").ClearContents
    ws.Range("CC202:CC240").Font.ColorIndex = xlAutomatic
    ws.Range("CC202:CC240").Font.Bold = False
    ws.Range("CC202:CC240").Font.Size = 10

    For i = 202 To 240

        empreendimento = Trim(CStr(ws.Cells(i, "Z").Value))
        producao = Trim(CStr(ws.Cells(i, "AB").Value))

        criticaNaoOK = False

        If empreendimento <> vbNullString Then

            For j = 202 To 240

                If i <> j Then

                    empreendimentoComparado = Trim(CStr(ws.Cells(j, "Z").Value))
                    producaoComparada = Trim(CStr(ws.Cells(j, "AB").Value))

                    If empreendimentoComparado = empreendimento Then

                        If producaoComparada <> producao Then
                            criticaNaoOK = True
                            existeCriticaNaoOK = True
                            Exit For
                        End If

                    End If

                End If

            Next j

        End If

        If criticaNaoOK Then

            With ws.Cells(i, "CC")
                .Value = "Crítica NÃO OK"
                .Font.Size = 10
                .Font.Bold = True
                .Font.Color = vbRed
            End With

        Else

            With ws.Cells(i, "CC")
                .Value = "Crítica OK"
                .Font.Size = 10
                .Font.Bold = False
                .Font.Color = vbBlue
            End With

        End If

    Next i

    valorCH202 = CStr(ws.Range("CH202").Value)
    valorCH202 = Replace(valorCH202, Chr(160), "")
    valorCH202 = Replace(valorCH202, vbCr, "")
    valorCH202 = Replace(valorCH202, vbLf, "")
    valorCH202 = UCase(Trim(valorCH202))

    If valorCH202 = "GERAR ERRO" Then

        lngMsgErros = lngMsgErros + 1
      '  intErro = intErro + 1

        strMsgEmpr = "{ERRO}- Cronograma - Existem itens financiados com o mesmo código de EMPREENDIMENTO BACEN, mas com SISTEMA DE PRODUÇÃO diferente." & vbCrLf & _
                     "Favor observar o ""Relatório de Informações Complementares dos Investimentos"", campo ""Código Sistema Produção""."

        preencherLinhaCritica "Inf.Compl.de Investimentos", strMsgEmpr

        xl00RelEmpr.Visible = xlSheetVisible
        xlSicor.Visible = xlSheetVeryHidden

        xl00RelEmpr.Activate
        'xl00RelEmpr.Unprotect "senhasBNxl"
        xl00RelEmpr.Protect "senhasBNxl"

    Else

        xl00RelEmpr.Visible = xlSheetVeryHidden
        xlSicor.Visible = xlSheetVeryHidden

    End If

Saida:

    On Error Resume Next

    ws.Protect "senhasBNxl"

    Application.EnableEvents = True
    Application.ScreenUpdating = True

   ' Exit Function

TrataErro:

  '  MsgBox "Erro na rotina CriticaEmpreendimentoSistemaProducao." & vbCrLf & _
     '      "Erro nº: " & Err.Number & vbCrLf & _
    '       "Descrição: " & Err.Description, _
    '       vbCritical, "Erro - Analisador"

    Resume Saida




' FIM - JORIS - CRITICA DE EMPREENDIMENTO
       
       
       
       
       
       
       'FIM para não permitir empreendimento com sist produção diferente.
       'FIM - Solicitação 1026893 - Inclusão Código Sistema Produção
       
        
        
        
        'Sprint 11 04/2017 - Atualização do Progresso
        Application.StatusBar = "Executando crítica do Projeto 80%"
       
        ' D000347 - 23/09/2014 - GSOL00829059
        ' Crítica o não-preenchimento de "Mesma Ativ. Cônjuge?" e "Pertence à Titular?" quando selecionado "PRONAF-MULHER".
        Dim booMesmaAtivConjugeOk As Boolean, booPertenceTitularOk As Boolean
        booMesmaAtivConjugeOk = True: booPertenceTitularOk = True
        
        For i = 129 To 133 ' Só verifica se for programa Pronaf Mulher (406)
            If xl03Prop.Range("D" & [i]) <> "" And InStr(xl03Prop.Range("E6"), "(406)") > 0 Then
                If xl03Prop.Range("i" & [i]) = "" Then booMesmaAtivConjugeOk = False
                If xl03Prop.Range("j" & [i]) = "" Then booPertenceTitularOk = False
            End If
        Next i
        
        If booMesmaAtivConjugeOk = False Then
            intErro = intErro + 1
            lngMsgErros = lngMsgErros + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Proposta) - " & _
                " É obrigatório o preenchimento do campo 'Mesma Ativ. Cônjuge?' para o programa Pronaf Mulher (406). " & vbCrLf
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
        End If
                
        If booPertenceTitularOk = False Then
            intErro = intErro + 1
            lngMsgErros = lngMsgErros + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Proposta) - " & _
                " É obrigatório o preenchimento do campo 'Pertence à Titular?' para o programa Pronaf Mulher (406). " & vbCrLf
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
        End If
        
        'Parcela 01
        If xl04Crono.Range("AZ12").Value <> 0 Then
            lngMsgErros = lngMsgErros + 1
            intErro = intErro + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                    " Data inválida na parcela 01. (Data Duplicada ou Formato Inválido). "
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
        End If
        
        'Parcela 02
        If xl04Crono.Range("BA12").Value <> 0 Then
          If xl04Crono.Range("BL12").Value = 0 Then
             lngMsgErros = lngMsgErros + 1
            intErro = intErro + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                    " Data inválida na parcela 02. (Data Duplicada ou Formato inválido). "
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
          ElseIf xl04Crono.Range("BL12").Value <> 0 Then
            lngMsgErros = lngMsgErros + 1
            intErro = intErro + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                    " Data da 2ª Parcela inferior ou igual a Data da 1ª Parcela. "
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
          End If
        End If
        
        'Parcela 03
        If xl04Crono.Range("BB12").Value <> 0 Then
            If xl04Crono.Range("BM12").Value = 0 Then
               lngMsgErros = lngMsgErros + 1
              intErro = intErro + 1
              strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                     " Data inválida na parcela 03. (Data Duplicada ou Formato inválido). "
              preencherLinhaCritica "", strMsgEmpr
              strMsgEmpr = vbNullString
          ElseIf xl04Crono.Range("BM12").Value <> 0 Then
             lngMsgErros = lngMsgErros + 1
            intErro = intErro + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                    " Data da 3ª Parcela inferior ou igual a Data da 2ª Parcela. "
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
          End If
        End If
        
        'Parcela 04
        If xl04Crono.Range("BC12").Value <> 0 Then
          If xl04Crono.Range("BN12").Value = 0 Then
             lngMsgErros = lngMsgErros + 1
            intErro = intErro + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos)  - " & _
                    " Data inválida na parcela 04. (Data Duplicada ou Formato inválido). " & vbCrLf
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
          ElseIf xl04Crono.Range("BN12").Value <> 0 Then
             lngMsgErros = lngMsgErros + 1
            intErro = intErro + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                    " Data da 4ª Parcela inferior ou igual a Data da 3ª Parcela. "
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
          End If
        End If
        
        'Atividade 184799 Sprint 14
        'Crítica das informações de Imóveis para operações Rurais
        'Sprint 14 Controle de Operações Rurais RNM ini
        Dim Munic_Bioma As String
        Dim OpRural_Branco As String
        
        For i = 1 To 3
          'NIRF
          If xl02Aval.Range("R" & [i] + 295).Value = -1 Then
            strMsgEmpr = strMsgEmpr & "- {Erro} (Avaliação) - O campo (" & xl02Aval.Range("R294").Value & ") do imóvel (" & xl02Aval.Range("D" & [i] + 295).Value & "-" & xl02Aval.Range("AC" & [i] + 295).Value & ") não está com o formato compatível determinado pelo Banco Central do Brasil."
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
            intErro = intErro + 1
            lngMsgErros = lngMsgErros + 1
          End If
          
          'Matricula CEI
          If xl02Aval.Range("S" & [i] + 295).Value = -1 Then
            strMsgEmpr = strMsgEmpr & "- {Erro} (Avaliação) - O campo (" & xl02Aval.Range("S294").Value & ") do imóvel (" & xl02Aval.Range("D" & [i] + 295).Value & "-" & xl02Aval.Range("AC" & [i] + 295).Value & ") supera o total de 12 caracteres."
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
            intErro = intErro + 1
            lngMsgErros = lngMsgErros + 1
          End If
          
          'Código SNCR
          If xl02Aval.Range("T" & [i] + 295).Value = -1 Then
            strMsgEmpr = strMsgEmpr & "- {Erro} (Avaliação) - O campo " & xl02Aval.Range("T294").Value & ") do imóvel (" & xl02Aval.Range("D" & [i] + 295).Value & "-" & xl02Aval.Range("AC" & [i] + 296).Value & ") não está com o formato compatível determinado pelo Banco Central do Brasil."
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
            intErro = intErro + 1
            lngMsgErros = lngMsgErros + 1
          End If
          
          'Número Registro CAR
          If xl02Aval.Range("U" & [i] + 295).Value = -1 Then
              strMsgEmpr = strMsgEmpr & "- {Erro} (Avaliação) - O campo (" & xl02Aval.Range("U294").Value & ") do imóvel (" & xl02Aval.Range("D" & [i] + 295).Value & "-" & xl02Aval.Range("AC" & [i] + 296).Value & ") não está com o formato compatível determinado pelo Banco Central do Brasil."
              preencherLinhaCritica "", strMsgEmpr
              strMsgEmpr = vbNullString
              intErro = intErro + 1
              lngMsgErros = lngMsgErros + 1
          End If
          
          'Número de Outorga de Água da Propriedade
          If xl02Aval.Range("P" & [i] + 295).Value = -1 Then
'Retirado a critica do catalogo 5.02 ini
'              strMsgEmpr = strMsgEmpr & "- {Aviso} (Avaliação) - O campo (" & xl02Aval.Range("P294").Value & ") do imóvel (" & xl02Aval.Range("D" & [i] + 295).Value & "-" & xl02Aval.Range("AC" & [i] + 296).Value & ") não está com o formato compatível determinado pelo Banco Central do Brasil."
'              preencherLinhaCritica "", strMsgEmpr
'              strMsgEmpr = vbNullString
'              lngMsgAvisos = lngMsgAvisos + 1
'Retirado a critica do catalogo 5.02 fim
          End If
          
          
          'Percentual de Preservação da Propriedade Acima do Limite Legal.
          If xl02Aval.Range("Q" & [i] + 295).Value = -1 Then
'Retirado a critica do catalogo 5.02 ini
'              strMsgEmpr = strMsgEmpr & "- {Aviso} (Avaliação) - O campo (" & xl02Aval.Range("Q294").Value & ") do imóvel (" & xl02Aval.Range("D" & [i] + 295).Value & "-" & xl02Aval.Range("AC" & [i] + 296).Value & ") não está com o formato compatível determinado pelo Enquadramento BACEN."
'              preencherLinhaCritica "", strMsgEmpr
'              strMsgEmpr = vbNullString
'              lngMsgAvisos = lngMsgAvisos + 1
'Retirado a critica do catalogo 5.02 fim
          End If
          
          'BIOMA
          If xl02Aval.Range("V" & [i] + 295).Value = -1 Then
            Munic_Bioma = Munic_Bioma & xl02Aval.Range("AC" & [i] + 295).Value & ";"
          End If
          
        Next i
              
       'Bioma - 01/2018 - RNM
       'Exclusão de Critica de Bioma Nro Car - RNM - INI
'       If xl00Visao.Range("Param_Hoje").Value >= xl00Visao.Range("Param_Bioma").Value Then
'         If Munic_Bioma <> "" Then
'           Munic_Bioma = Mid(Munic_Bioma, 1, Len(Munic_Bioma) - 1)
'           strMsgEmpr = strMsgEmpr & "- {Erro} (Avaliação) - O(s) município(s) (" & Munic_Bioma & ") , contido(s) no Bioma da Amazônia, possui(em) imóvel(is) sem a informação do 'Número Registro CAR'."
'           preencherLinhaCritica "", strMsgEmpr
'           strMsgEmpr = vbNullString
'           intErro = intErro + 1
'           lngMsgErros = lngMsgErros + 1
'         End If
'       End If
       'Exclusão de Critica de Bioma Nro Car - RNM - FIM
      'Sprint 14 Controle de Operações Rurais RNM FIM
      
      'xx
            ' joris ajustdo
            ' cronograma
 Dim flaglimite As Long


If Val(xl03Prop.Range("H69").Value) <> 0 Then
    flaglimite = 129
    
    ''If Trim(CStr(xl04Crono.Range("J129").Value)) = vbNullString Then
       '' MsgBox "A célula J129 deve estar preenchida.", vbExclamation
        'Exit Sub
   '' End If
    
Else
    flaglimite = 128
End If
 
 
 

'xxx

For intLinCel = 15 To flaglimite Step 3
    If Trim(CStr(xl04Crono.Range("J" & intLinCel).Value)) = vbNullString Then
        If Val(xl04Crono.Range("J" & (intLinCel + 1)).Value) > 0 Or _
           Trim(CStr(xl04Crono.Range("K" & intLinCel).Value)) <> vbNullString Then
           
            lngMsgErros = lngMsgErros + 1
            intErro = intErro + 1
            strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                         "Data sem preenchimento na 1ª parcela da inversão " & _
                         xl04Crono.Range("D" & intLinCel).Value & ". "
            preencherLinhaCritica "", strMsgEmpr
            strMsgEmpr = vbNullString
        End If
    End If
Next intLinCel
            
           ' xxx
            If RTrim(LTrim(xl04Crono.Range("k" & intLinCel).Value)) = vbNullString Then
              If xl04Crono.Range("K" & intLinCel + 1).Value > 0 Or _
                 RTrim(LTrim(xl04Crono.Range("L" & intLinCel).Value)) <> vbNullString Then
                 
                 lngMsgErros = lngMsgErros + 1
                 
                intErro = intErro + 1
                strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                    "Data sem preenchimento na 2ª parcela da inversão " & xl04Crono.Range("D" & intLinCel).Value & ". "
                preencherLinhaCritica "", strMsgEmpr
                strMsgEmpr = vbNullString
              End If
            End If

             If RTrim(LTrim(xl04Crono.Range("L" & intLinCel).Value)) = vbNullString Then
              If xl04Crono.Range("L" & intLinCel + 1).Value > 0 Then
                  lngMsgErros = lngMsgErros + 1
                 intErro = intErro + 1
                 strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                    "Data sem preenchimento na 3ª parcela da inversão " & xl04Crono.Range("D" & intLinCel).Value & ". "
                preencherLinhaCritica "", strMsgEmpr
                strMsgEmpr = vbNullString
              End If
            End If
            
            If RTrim(LTrim(xl04Crono.Range("M" & intLinCel).Value)) = vbNullString Then
              If xl04Crono.Range("M" & intLinCel + 1).Value > 0 Then
                  lngMsgErros = lngMsgErros + 1
                 intErro = intErro + 1
                 strMsgEmpr = strMsgEmpr & "{ERRO} (Cronograma de Desembolsos) - " & _
                    "Data sem preenchimento na 4ª parcela da inversão " & xl04Crono.Range("D" & intLinCel).Value & ". "
                 preencherLinhaCritica "", strMsgEmpr
                 strMsgEmpr = vbNullString
              End If
            End If
             
            'If strMsgEmpr <> vbNullString Then
            '   preencherLinhaCritica "", strMsgEmpr
            '   strMsgEmpr = vbNullString
            'End If
            
            'Este código não é possível rodar devido ao ERRO 2015 #Valor da data que é inválida.
            'If xl04Crono.Range("AB" & intLinCel + 1).Value >= xl04Crono.Range("AA" & intLinCel + 1).Value Then
            '     intErro = intErro + 1
            '     strMsgEmpr = strMsgEmpr & "{ERRO} - Cronograma - " & _
            '        " Data da 2ª Parcela maior que a 1ª Parcela, " & vbCrLf
            'End If
           '
           ' If xl04Crono.Range("AC" & intLinCel + 1).Value >= xl04Crono.Range("AB" & intLinCel + 1).Value Then
           '      intErro = intErro + 1
           '      strMsgEmpr = strMsgEmpr & "{ERRO} - Cronograma - " & _
           '         " Data da 3ª Parcela maior que a 2ª Parcela, " & vbCrLf
           ' End If
           '
           ' If xl04Crono.Range("AD" & intLinCel + 1).Value >= xl04Crono.Range("AC" & intLinCel + 1).Value Then
           '      intErro = intErro + 1
           '      strMsgEmpr = strMsgEmpr & "{ERRO} - Cronograma - " & _
           '         " Data da 4ª Parcela maior que a 3ª Parcela, " & vbCrLf
           ' End If
    
        'Sprint 11 04/2017 - Atualização do Progresso
         
         
        'GSOL01921068 - RNM Críticas INI - Inclusão da Taxa de Juros de Crédito Rural
        If Sheets(" Proposta").Range("AN193").Value <> 1 And Sheets(" Proposta").Range("AN193").Value <> 2 Then
           strMsgEmpr = strMsgEmpr & "- {Erro} A Metodologia de Cálculo da Taxa de Juros não foi informada."
           preencherLinhaCritica "Proposta - TJCR", strMsgEmpr & ". "
           strMsgEmpr = vbNullString
           intErro = intErro + 1
           lngMsgErros = lngMsgErros + 1
        End If
        'GSOL01921068 - RNM Críticas FIM - Inclusão da Taxa de Juros de Crédito Rural
          
         
        Application.StatusBar = "Executando crítica do Projeto 100%"
        
        If intErro > 0 And strMsgEmpr <> vbNullString Then
           preencherLinhaCritica "", "" & strMsgEmpr
        End If
        
        'RNM CRÍTICA DE ATIVIDADE - 08/10/2013 FIM
        'If intErro > 0 Then
           'RNM CRÍTICA DE ATIVIDADE - 25/09/2013 INI
           If strMsg <> vbNullString Then
             preencherLinhaCritica "", "{AVISO} - (Outras Atividades) - " & strMsg & "."
             'RNM CRÍTICA DE ATIVIDADE - 25/09/2013 FIM
             'lngMsgErros = lngLogErr + intErro
             'intErro = 0
             strMsg = vbNullString
           End If
        'End If
       
        'If intErro > 0 Then
        '   preencherLinhaCritica "Guia Suporte Forrageiro", strMsg & "."
        '   lngLogErr = lngLogErr + intErro
        '   intErro = 0
        '   strMsg = vbNullString
        'End If
      
        'Sprint 11 04/2017 - Atualização do Progresso
        Application.StatusBar = ""
      
        If lngMsgErros > 0 Then CriticaProjeto = True
        Sheets([xlPlanAtual]).Activate
        CarregamentoRapido False
        protPlan.FinalizaRotina
        Set protPlan = Nothing
        
        
        '
        
End Function

Sub preencherLinhaCritica(Optional strTitulo As String, Optional strMsg As String)
    Dim xlPlanAtualErro As String
    Dim lngLinCrc As Long
    Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao
    
    xlPlanAtualErro = ActiveSheet.Name
    xl00Critica.Activate
    protPlan.DesprotegePlanilha
    lngLinCrc = Application.WorksheetFunction.CountA(Range("E10:E1000")) + 12
    Range("B" & [lngLinCrc]).Value = strTitulo
    Range("E" & [lngLinCrc]).Value = strMsg
    Range("B" & [lngLinCrc]).Font.Bold = True
    Range("E" & [lngLinCrc]).EntireRow.AutoFit
    protPlan.ProtegePlanilha
    Sheets([xlPlanAtualErro]).Activate
    Set protPlan = Nothing
    
    
        
    
    
End Sub

Sub VerCriticaProjeto(Optional iFlag As Integer)
    Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao
    Application.ScreenUpdating = False
    
    If Not CriticaProjeto Then
       If iFlag <> 1 Then MsgBox "As criticas relizadas não retornaram erros" & vbCrLf & _
                                "Projeto OK", vbInformation
       Set protPlan = Nothing
       Exit Sub
    End If
    protPlan.IniciaRotina True
    Dim xlPlan As String
    xlPlan = ActiveSheet.Name
    xl00Critica.Activate
    On Error GoTo Fim
    If MsgBox("Foram detectadas inconsistências no projeto." & vbCrLf & _
              "Deseja imprimir o relatório de Críticas?", vbQuestion + vbYesNo, _
              ":: Planilha de Pronaf Unificado - Verificação") = vbYes Then ActiveWindow.SelectedSheets.PrintPreview
    
    protPlan.DesprotegePlanilha
    Range("B12:E100").Font.Bold = False
    Range("B12:E100").ClearContents
    protPlan.ProtegePlanilha
    Sheets([xlPlan]).Activate
    
     'oculta critica - Joris
        
        xl00Critica.Visible = xlSheetVeryHidden
    
    
    
Fim:
    protPlan.FinalizaRotina
    Set protPlan = Nothing
End Sub

Public Function DataAdiciona(strIntervalo As String, dblQtd As Double, dtDataInicial As Date)
'       strIntervalo
'       yyyy Ano
'       q    Trimestre
'       m    Mês
'       y    Dia do ano
'       d    Dia
'       w    Dia da semana
'       ww   Semana
'       h    Hora
'       n    Minuto
'       s    Segundo
       DataAdiciona = DateAdd(strIntervalo, dblQtd, dtDataInicial)
End Function




