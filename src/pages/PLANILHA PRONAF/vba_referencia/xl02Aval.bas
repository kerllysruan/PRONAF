Attribute VB_Name = "xl02Aval"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Private Sub Worksheet_Activate()

On Error Resume Next
xl02Aval.Range("J7").Value = CStr(xl02Aval.Range("J7").Value)
On Error GoTo 0



 On Error Resume Next
    Me.Unprotect Password:="senhasBNxl"
    Me.Range("J7:J9").NumberFormat = "@"
    Me.Protect Password:="senhasBNxl"
    On Error GoTo 0
    




        If ActiveSheet.Name <> "Avaliação" Then Exit Sub
        ActiveSheet.ScrollArea = ""
        ' RTC-1207004 Formata_Informcacao
        AtualizaTela
        On Error Resume Next
        
        CommandBars("Plan_PRONAFA2").Controls(5).Enabled = False
        CommandBars("Plan_PRONAFA2").Controls(7).Enabled = True
        CommandBars("Plan_PRONAFA2").Controls(8).Enabled = True
End Sub

Private Sub Worksheet_Calculate()
        Dim objCelula As String
        If ActiveCell.Row >= 7 And _
           ActiveCell.Row <= 9 And _
           ActiveCell.Column = 13 Then
           If Range("X" & ActiveCell.Row).Value = 0 Then
              flagBusca = 1
              MsgBox "Os imóveis em garantia devem ser informados inicialmente.", vbInformation
              If UCase(Range("M" & ActiveCell.Row).Value) = "SIM" Then
                 Range("M" & ActiveCell.Row).Value = "Não"
              Else
                 Range("M" & ActiveCell.Row).Value = "Sim"
              End If
              flagBusca = 0
           End If
           objCelula = ActiveCell.Address
           AtualizaTela
           Range(objCelula).Select
        End If

End Sub

Private Sub Worksheet_Change(ByVal Target As Range)



''xxx
' Joris Bane
' tratamento CNPJ - 10.03.2026


 

    Dim protPlan As clsProtecao
    Dim rngDocs As Range
    
    On Error GoTo TrataErro

    If Target Is Nothing Then GoTo Saida
    If Target.CountLarge > 1 Then GoTo Saida
    
    Set rngDocs = Intersect(Target, Me.Range("J7:J9"))
    
    If Not rngDocs Is Nothing Then
        Application.EnableEvents = False
        Me.Unprotect Password:="senhasBNxl"
        
        ProcessarDocumento rngDocs.Cells(1, 1)
        
        GoTo Saida
    End If

''XX ATÉ AQUI.



    If ActiveSheet.Name <> "Avaliação" Then GoTo Saida
    If flagBusca = 1 Then GoTo Saida



    '==== RESTANTE DO SEU CÓDIGO ORIGINAL ====


        If ActiveSheet.Name <> "Avaliação" Then Exit Sub
        If flagBusca = 1 Then Exit Sub
      
        Set protPlan = New clsProtecao
        
      
        
'        'Sprint 14 Controle de Operações Rurais RNM INI
'        If Target.Row >= 296 And Target.Row <= 299 Then
'          If Target.Column = 5 Or Target.Column = 8 Or Target.Column = 10 Or Target.Column = 12 Then
'            If Range(Left(Target.Address, 6)).Value <> vbNullString Then
'                If Target.Column = 5 Then
'                  If Target.Address <> "$E$295" Then
'                     protPlan.DesprotegePlanilha
'                     Range("E295").Value = "NIRF" & "    " & Len(Range(Left(Target.Address, 6)).Value)
'                     protPlan.ProtegePlanilha
'                  End If
'                End If
'                If Target.Column = 8 Then
'                  'If Target.Address <> "$H$295" Then 'Ricardo rtc 600512 29/09/2021
'                  If Target.Address <> "$G$295" Then
'                     protPlan.DesprotegePlanilha
'                     'Range("H295").Value = "CEI" & "     " & Len(Range(Left(Target.Address, 6)).Value) 'Ricardo rtc 600512 29/09/2021
'                     Range("G295").Value = "CEI" & "     " & Len(Range(Left(Target.Address, 6)).Value)
'                     protPlan.ProtegePlanilha
'                  End If
'                End If
'                If Target.Column = 10 Then
'                 ' If Target.Address <> "$J$295" Then 'Ricardo rtc 600512 29/09/2021
'                   If Target.Address <> "$I$295" Then
'                     protPlan.DesprotegePlanilha
'                     Range("I295").Value = "SNCR" & "    " & Len(Range(Left(Target.Address, 6)).Value)
'                     protPlan.ProtegePlanilha
'                  End If
'                End If
'                If Target.Column = 12 Then  'Era L295 e Troquei para J295. Ricardo 29/09/2021
'                  If Target.Address <> "$J$295" Then
'                     protPlan.DesprotegePlanilha
'                     Range("J295").Value = "Registro CAR" & "     " & Len(Range(Left(Target.Address, 6)).Value)
'                     protPlan.ProtegePlanilha
'                  End If
'                End If
'            End If
'          End If
'        End If
'        'Sprint 14 Controle de Operações Rurais RNM FIM
        
        If Left(Target.Address, 4) = "$E$7" Then
           If Range("E7").Value = vbNullString Then Exit Sub
           protPlan.IniciaRotina False
           flagBusca = 1
           celBusca = Range("E7").Value
           planBusca = ActiveSheet.Name
           resBusca = "E7"
           BuscaMunicipio
           protPlan.FinalizaRotina
           Set protPlan = Nothing
           Exit Sub
        End If
        
        If Left(Target.Address, 4) = "$E$8" Then
           If Range("E8").Value = vbNullString Then Exit Sub
           protPlan.IniciaRotina False
           flagBusca = 1
           celBusca = Range("E8").Value
           planBusca = ActiveSheet.Name
           resBusca = "E8"
           BuscaMunicipio
           protPlan.FinalizaRotina
           Set protPlan = Nothing
           Exit Sub
        End If
        
        If Left(Target.Address, 4) = "$E$9" Then
           If Range("E9").Value = vbNullString Then Exit Sub
           protPlan.IniciaRotina False
           flagBusca = 1
           celBusca = Range("E9").Value
           planBusca = ActiveSheet.Name
           resBusca = "E9"
           BuscaMunicipio
           protPlan.FinalizaRotina
           Set protPlan = Nothing
           Exit Sub
        End If
        'SPRINT 11 - INI 04/2017  - Limpar Imóvel
        If Left(Target.Address, 4) = "$D$8" Then
           If Range("D8").Value = vbNullString Then
                If MsgBox("Confirma exclusão de todos os dados inseridos para este imóvel ?", _
                   vbYesNo, "Confirmação") = vbYes Then
                   protPlan.IniciaRotina
                   Range("D8:M8").Select
                   Selection.ClearContents
                   Range("D8").Select
                   Range("D77:K86").Select
                   Selection.ClearContents
                   Range("D88:K97").Select
                   Selection.ClearContents
                   Range("E98:K100").Select
                   Selection.ClearContents
                   Range("J103").Select
                   Selection.ClearContents
                   Range("D109:K128").Select
                   Selection.ClearContents
                Else
                   protPlan.FinalizaRotina
                   Set protPlan = Nothing
                   Exit Sub
                End If
           End If
        End If
        'SPRINT 11 - FIM 04/2017
        'Exclusão de Terras/Cobert e Edif/Instalaç do imóvel 3
        
        'SPRINT 11 - INI 04/2017
        If Left(Target.Address, 4) = "$D$9" Then
           If Range("D9").Value = vbNullString Then
               If MsgBox("Confirma exclusão de todos os dados inseridos para este imóvel ?", _
                  vbYesNo, "Confirmação") = vbYes Then
                  Range("D9:M9").Select
                  protPlan.IniciaRotina
                  Selection.ClearContents
                  Range("D137:K146").Select
                  Selection.ClearContents
                  Range("D148:K157").Select
                  Selection.ClearContents
                  Range("E158:K160").Select
                  Selection.ClearContents
                  Range("J163").Select
                  Selection.ClearContents
                  Range("D169:K188").Select
                  Selection.ClearContents
               Else
                  protPlan.FinalizaRotina
                  Set protPlan = Nothing
                  Exit Sub
               End If
           End If
        End If
        'SPRINT 11 - FIM 04/2017
        'GSOL01924692 - INI NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018
        If Target.Column = 10 Then
            If Target.Row >= 7 And Target.Row < 10 Then
               protPlan.IniciaRotina False
               flagBusca = 1
               
               '' retirei em 11.03.2026
               '' joris
               
               
              '' If Cells(Target.Row, Target.Column).Value = vbNullString Or _
                  Len(Cells(Target.Row, Target.Column).Value) <= 11 Then
             ''     Cells(Target.Row, Target.Column).NumberFormat = "000"".""000"".""000-00"
          ''     Else
            ''      Cells(Target.Row, Target.Column).NumberFormat = "00"".""000"".""000""/""0000-00"
           ''    End If
               
               '' até aqui
               
               flagBusca = 0
               protPlan.FinalizaRotina
            End If
        End If
        'GSOL01924692 - FIM NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018
        
        If (Target.Row >= 28 And Target.Row <= 37) Or (Target.Row >= 17 And Target.Row <= 26) Then
            If Target.Column = 4 Then
                If Cells(Target.Row, Target.Column).Text = "" Then Exit Sub
                protPlan.IniciaRotina False
                flagBusca = 1
                celBusca = Cells(Target.Row, Target.Column).Text
                planBusca = ActiveSheet.Name
                resBusca = Target.Row
                Call BuscaExploracaoTerrasCoberturas(celBusca, planBusca, resBusca)
                protPlan.FinalizaRotina
                Set protPlan = Nothing
                Exit Sub
            End If
        End If
        
        Set protPlan = Nothing
        
        ' JORIS BANE
Saida:
    On Error Resume Next
    Application.EnableEvents = True
    Exit Sub



TrataErro:
  ''  MsgBox "Erro no Worksheet_Change: " & Err.Description, vbExclamation
    Resume Saida
' JORIS BANE END
        
End Sub

Private Sub Worksheet_Deactivate()
        On Error Resume Next
        CommandBars("Plan_PRONAFA2").Controls(5).Enabled = True
End Sub
