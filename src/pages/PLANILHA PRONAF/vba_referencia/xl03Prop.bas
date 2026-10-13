Attribute VB_Name = "xl03Prop"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Private Sub Worksheet_Calculate()

    If ActiveSheet.Name <> " Proposta" Then Exit Sub

    Dim protPlan As clsProtecao

    If ActiveCell.Address = "$E$6" Then

        Set protPlan = New clsProtecao

        protPlan.IniciaRotina False
        flagBusca = 1

        telaDeclPRONAF xl00Visao.Range("flagDecPRONAF").Value
        Range("E7").Select

        ActiveWindow.Caption = ".:: PLANILHA PRONAF A - Versão 2.0 "

        flagBusca = 0
        protPlan.FinalizaRotina
        Set protPlan = Nothing

        Exit Sub
    End If

End Sub


Private Sub Worksheet_Activate()

    On Error GoTo TrataErro

    Me.Unprotect Password:="senhasBNxl"
    Me.Range("E13,E15").NumberFormat = "@"
    Me.Protect Password:="senhasBNxl"

    If ActiveSheet.Name <> " Proposta" Then Exit Sub

    AtualizaTela

    On Error Resume Next
    CommandBars("Plan_PRONAFA2").Controls(5).Enabled = False
    CommandBars("Plan_PRONAFA2").Controls(7).Enabled = True
    CommandBars("Plan_PRONAFA2").Controls(8).Enabled = True
    On Error GoTo TrataErro

Saida:
    On Error Resume Next
    Application.EnableEvents = True
    Exit Sub

TrataErro:
    Resume Saida

End Sub


Private Sub Worksheet_Deactivate()

    On Error Resume Next
    CommandBars("Plan_PRONAFA2").Controls(5).Enabled = True
    CommandBars("Plan_PRONAFA2").Controls(7).Enabled = False
    CommandBars("Plan_PRONAFA2").Controls(8).Enabled = False

End Sub


Private Sub Worksheet_Change(ByVal Target As Range)

    Dim protPlan As clsProtecao
    Dim rngDocs As Range
    Dim CelTratamento As Range

    On Error GoTo TrataErro

    If Target Is Nothing Then GoTo Saida
    If Target.CountLarge > 1 Then GoTo Saida

    If Me.Name <> " Proposta" Then GoTo Saida
    If flagBusca = 1 Then GoTo Saida
    If Me.Range("W1").Value = 1 Then GoTo Saida

    Set protPlan = New clsProtecao
    protPlan.IniciaRotina False

    ' =====================================================
    ' E6
    ' =====================================================
    If Not Intersect(Target, Me.Range("E6")) Is Nothing Then
        If Target.Value <> vbNullString Then
            Grupo330_Clique
        End If

        flagBusca = 0
        GoTo Saida
    End If

    ' =====================================================
    ' H22 - MUNICÍPIO
    ' =====================================================
    If Not Intersect(Target, Me.Range("H22")) Is Nothing Then

        If Trim(Me.Range("H22").Value) = vbNullString Then GoTo Saida

        flagBusca = 1

        celBusca = CStr(Me.Range("H22").Value)
        planBusca = Me.Name
        resBusca = "H22"

        BuscaMunicipio

        flagBusca = 0
        GoTo Saida

    End If

    ' =====================================================
    ' E7 - AGÊNCIA
    ' =====================================================
    If Not Intersect(Target, Me.Range("E7")) Is Nothing Then

        If Trim(Me.Range("E7").Value) = vbNullString Then GoTo Saida

        flagBusca = 1

        celBusca = CStr(Me.Range("E7").Value)
        planBusca = Me.Name
        resBusca = "E7"

        BuscaAgencia

        flagBusca = 0
        GoTo Saida

    End If

    ' =====================================================
    ' E8 - REGIÃO
    ' =====================================================
    If Not Intersect(Target, Me.Range("E8")) Is Nothing Then

        If Trim(Me.Range("E8").Value) = vbNullString Then GoTo Saida

        flagBusca = 1

        celBusca = CStr(Me.Range("E8").Value)

        If xl01Cliente.Range("W50").Value <> Me.Range("E8").Value Then
            MsgBox "Região selecionada não corresponde com a região do município da atividade!", vbExclamation
            Me.Range("E8").Value = xl01Cliente.Range("W50").Value
        End If

        flagBusca = 0
        GoTo Saida

    End If

    ' =====================================================
    ' E9 - ATIVIDADE
    ' =====================================================
    If Not Intersect(Target, Me.Range("E9")) Is Nothing Then

        If Trim(Me.Range("E9").Value) = vbNullString Then GoTo Saida

        flagBusca = 1

        celBusca = CStr(Me.Range("E9").Value)
        planBusca = Me.Name
        resBusca = "E9"

        BuscaAtividade

        flagBusca = 0
        GoTo Saida

    End If

    ' =====================================================
    ' D22 - LIMPAR IMÓVEL
    ' =====================================================
    If Not Intersect(Target, Me.Range("D22")) Is Nothing Then

        If Me.Range("D22").Value <> vbNullString Then GoTo Saida

        If MsgBox("Os dados de informações dos Imóveis vinculados ao plano serão apagados." & Chr(13) & _
                  "Deseja confirmar a exclusão?", vbYesNo + vbInformation, "Atenção") = vbYes Then

            Me.Range("AI" & Target.Row & ":AL" & Target.Row).ClearContents
            LimparComentImv 22

        Else
            Application.Undo
        End If

        GoTo Saida

    End If

    ' =====================================================
    ' LINHAS 27 A 68
    ' =====================================================
    If Target.Row >= 27 And Target.Row <= 68 Then

        If Target.Column >= 10 And Target.Column <= 14 Then

            If Target.Text = "" Then GoTo Saida
            If Not IsNumeric(Target.Value) Then GoTo Saida

            flagBusca = 1
            Target.FormulaR1C1 = Application.WorksheetFunction.Round(Target.Value, 2)

            If Me.Cells(69, 8).Value <> 0 And Me.Cells(69, 8).Value > Me.Cells(69, 17).Value Then
                Me.Cells(69, 8).FormulaR1C1 = Me.Cells(69, 17).Value
            End If

            flagBusca = 0

        End If

        If Target.Column = 6 Then

            If Target.Text = "" Then GoTo Saida
            If Not IsNumeric(Target.Value) Then GoTo Saida

            flagBusca = 1
            Target.FormulaR1C1 = Application.WorksheetFunction.Round(Target.Value, 2)

            If Me.Cells(69, 8).Value <> 0 And Me.Cells(69, 8).Value > Me.Cells(69, 17).Value Then
                Me.Cells(69, 8).FormulaR1C1 = Me.Cells(69, 17).Value
            End If

            flagBusca = 0

        End If

        If Target.Column = 4 Then

            flagBusca = 1
            protPlan.DesprotegePlanilha
            Me.Rows(Target.Row).AutoFit
            protPlan.ProtegePlanilha
            flagBusca = 0

        End If

    End If

    ' =====================================================
    ' LINHAS 129 A 130
    ' =====================================================
    If Target.Row >= 129 And Target.Row <= 130 _
       And Target.Column >= 4 And Target.Column <= 14 Then

        xl09CalcFinanc.Range("Y12").Value = 1

    End If

    ' =====================================================
    ' E13 E E15 - CPF/CNPJ COMO TEXTO
    ' =====================================================
    Set rngDocs = Intersect(Target, Me.Range("E13,E15"))
    


    If Not rngDocs Is Nothing Then

        Application.EnableEvents = False
        Me.Unprotect Password:="senhasBNxl"
        Me.Range("E13,E15").NumberFormat = "@"
        
        
        If rngDocs.Cells(1, 1).MergeCells Then
            Set CelTratamento = rngDocs.Cells(1, 1).MergeArea.Cells(1, 1)
        Else
            Set CelTratamento = rngDocs.Cells(1, 1)
        End If

        ProcessarDocumento CelTratamento

        GoTo Saida

    End If

    Grupo330_Clique

Saida:
    On Error Resume Next

    flagBusca = 0

    If Not protPlan Is Nothing Then
        protPlan.FinalizaRotina
        Set protPlan = Nothing
    End If

    Me.Protect Password:="senhasBNxl"
    Application.EnableEvents = True

    Exit Sub

TrataErro:
    Resume Saida

End Sub


Sub Grupo330_Clique()

    If Range("H71").Value = 1 Then
        Range("H69").Value = 5
    Else
        Range("H69").Value = 0
        Range("Q69").Value = 0
    End If

    Range("J69").Calculate

    Application.EnableEvents = False
    Application.Calculation = xlCalculationAutomatic
    Me.Calculate
    Application.EnableEvents = True

End Sub


Private Sub Worksheet_FollowHyperlink(ByVal Target As Hyperlink)

    frmInfoImovel.Show

End Sub

