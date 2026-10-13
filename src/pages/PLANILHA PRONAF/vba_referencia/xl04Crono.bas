Attribute VB_Name = "xl04Crono"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True

Private Sub Worksheet_Activate()
        If ActiveSheet.Name <> "Cronograma" Then Exit Sub
        Dim protPlan As clsProtecao
        Set protPlan = New clsProtecao

        'Atualiza as atividades disponíveis no combobox "Atividade PGPAF"
        'Tratamento do campo Atividade PGPAF
        Application.ScreenUpdating = False
        CarregamentoRapido True

        protPlan.IniciaRotina True
        flagBusca = 1
        If Plan3.Range("RECEITA_PGPAF").Value = 0 Or xl03Prop.Range("AL6").Value = 377 Or xl03Prop.Range("AL6").Value = 371 Or xl03Prop.Range("AL6").Value = 398 Or xl03Prop.Range("AL6").Value = 410 Then 'Nao tem PGPAF ou é FLORESTA, AGRINF ou AGROINDUSTRIA
            Range("J314").Value = "Não se aplica."
            Range("J314").Interior.ColorIndex = 15
            Range("J314").Validation.Delete
            'Atividade 273157 - Falha na planilha Pronaf RNM
            protPlan.IniciaRotina True
            If Range("J314").Locked = False Then
               Range("J314").Select
               Selection.Locked = True
               Selection.FormulaHidden = True
            End If
            'Range("J314").Locked = True - O excel nao quer executar essa instrucao.
        Else
            'Atividade 273157 - Falha na planilha Pronaf RNM
            protPlan.IniciaRotina True
            If Range("J314").Locked Then
               Range("J314").Select
               Selection.Locked = False
               Selection.FormulaHidden = False
            End If
            'Range("J314").Locked = False - O excel nao quer executar essa instrucao.
            If Range("J314").Interior.ColorIndex = 15 Then
                If Range("J314").Value = "Não se aplica." Then
                    Range("J314").Value = ""
                End If
                Range("J314").Interior.ColorIndex = xlNone
            End If

            Dim lista As String
            lista = atualizaAtividadePGPAF
            
            With Range("J314").Validation
                .Delete
                .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:= _
                 xlBetween, Formula1:=lista
                .IgnoreBlank = True
                .InCellDropdown = True
                .InputTitle = ""
                .ErrorTitle = "Escolha uma opção da lista"
                .InputMessage = ""
                .ErrorMessage = "Deve ser escolhido uma atividade PGPAF da lista"
                .ShowInput = True
                .ShowError = True
            End With
        End If
        
        Application.ScreenUpdating = False
        'GSOL00663906 Inserir Componente de Preencher Empreendimento.
        For i = 2 To 36
            If i < 10 Then
                If (Range("D20" & i).Value = vbNullString) Or (Range("D20" & i).Value = "") Then
                    If Range("J20" & i).Value <> vbNullString Then Range("J20" & i & ":M20" & i).ClearContents  'descrição  - Sprint 11 alterar de L para M devido a inclusão da 05 parcela
                    If Range("Z20" & i).Value <> vbNullString Then Range("Z20" & i).ClearContents               'cod empreendimento
                    If Range("AB20" & i).Value <> vbNullString Then Range("AB20" & i).ClearContents             'sistema de produção
                    If Range("AC20" & i).Value <> vbNullString Then Range("AC20" & i).ClearContents             'unidade
                    If Range("AD20" & i).Value <> vbNullString Then Range("AD20" & i).ClearContents               'ATIVIDADE  ' 25/09/2013
                    If Range("BT20" & i).Value <> vbNullString Then Range("BT20" & i).ClearContents  'Finalidade e Modalidade   ' 25/09/2013
                    If Range("BU20" & i).Value <> vbNullString Then Range("BU20" & i).ClearContents  'Finalidade e Modalidade   ' 25/09/2013
                    Range("J20" & i).ClearComments                                                              'comentario
                End If
            Else
              If Range("D2" & i).Value = vbNullString Then
                If Range("J2" & i).Value <> vbNullString Then Range("J20" & i & ":M20" & i).ClearContents   'descrição - Sprint 11 alterar de L para M devido a inclusão da 05 parcela
                If Range("Z2" & i).Value <> vbNullString Then Range("Z2" & i).ClearContents                 'cod empreendimento
                If Range("AB2" & i).Value <> vbNullString Then Range("AB2" & i).ClearContents               'sistema de produção
                If Range("AC2" & i).Value <> vbNullString Then Range("AC2" & i).ClearContents               'unidade
                If Range("AD2" & i).Value <> vbNullString Then Range("AC2" & i).ClearContents               'ATIVIDADE  ' 25/09/2013
                If Range("BT2" & i).Value <> vbNullString Then Range("BT2" & i).ClearContents               'Finalidade e Modalidade   ' 25/09/2013
                If Range("BU2" & i).Value <> vbNullString Then Range("BU2" & i).ClearContents               'Finalidade e Modalidade   ' 25/09/2013
                Range("J2" & i).ClearComments                                                               'comentario
                End If
            End If
        Next i
        
        CarregamentoRapido True
        ' RTC 1207004 Call Format_Crono
        
        'GSOL01931222 - Inclusão de área de apascentamento  RNM
        If Range("F202:F240").Locked Then
           Range("F202:F240").Locked = False
        End If
        
        Range("F202:F240").Select
        Selection.NumberFormat = "0.00"
        
        Application.ScreenUpdating = False
        'AtualizaTela
         Criar_Botao ' Na criação do botão deverá atualizar a tela
        'GSOL00663906 Inserir Componente de Preencher Empreendimento.
        
        flagBusca = 0
        flagTela = 1
        
        protPlan.FinalizaRotina
        Set protPlan = Nothing
    
        CarregamentoRapido True

    
        AtualizaTela
        ActiveWindow.SmallScroll Down:=-2000
        Range("C4").Select
        Application.Calculation = xlAutomatic
        
End Sub

Private Sub Worksheet_Change(ByVal Target As Range)

        If ActiveSheet.Name <> "Cronograma" Then Exit Sub

        If flagBusca = 1 Then Exit Sub
        Dim protPlan As clsProtecao
        Set protPlan = New clsProtecao

        Application.ScreenUpdating = False
        'ActiveWindow.Zoom = 100  'Retirar Plano Safra 2016/2017 - solicitação do Paulo Manso RNM
        CarregamentoRapido True
        'Calculate
         
        'if Target.Column = 12 and Target.Row

        If Target.Column = 10 And Target.Row >= 202 And Target.Row <= 240 Then
           On Error Resume Next
           If Cells(Target.Row, Target.Column).Value = vbNullString Then Exit Sub
           If Err Then
              flagBusca = 0
              Set protPlan = Nothing
              Exit Sub
           End If
'           ProtPlan.IniciaRotina False
'           flagBusca = 1
'           celBusca = Cells(Target.Row, Target.Column).Value
'           planBusca = ActiveSheet.Name
'           resBusca = Target.Address
'           BuscaEmpreendimentoBACEN
'           ProtPlan.FinalizaRotina
'           flagBusca = 0
'           Set ProtPlan = Nothing
'           Exit Sub
        End If
        
        If Target.Column >= 7 And Target.Row >= 243 And Target.Row <= 281 Then
            
            Dim StrFin As String
            Dim BooFin As Boolean
            
            StrFin = Range("G243").Value
            
            For i = 243 To 281
              If Range("D" & [i]).Value <> "" Then
                 If Range("G" & [i]).Value <> StrFin Then
                   BooFin = True
                   Exit For
                 End If
              End If
            Next i
            
            ' And BooFin
            
            Range("D311").Calculate
            If Range("D311").Value = "" Then
                'Botão de Financiamento
                CommandBars("Plan_PRONAFA2").Controls(11).Enabled = True
                
                Set oBotao = CommandBars("Plan_PRONAFA2").FindControl(Type:=msoControlPopup, Tag:="mnuFinanc")
        
                If xl04Crono.Range("AR217").Value <> 0 Then
                    oBotao.Controls(1).Caption = "Finalidade: " & xl04Crono.Range("AR217").Value
                    oBotao.Controls(1).Enabled = True
                Else
                    oBotao.Controls(1).Caption = "Finalidade 01"
                    oBotao.Controls(1).Enabled = False
                End If
                If xl04Crono.Range("AR219").Value <> 0 Then
                    oBotao.Controls(2).Caption = "Finalidade: " & xl04Crono.Range("AR219").Value
                    oBotao.Controls(2).Enabled = True
                Else
                    oBotao.Controls(2).Caption = "Finalidade 02"
                    oBotao.Controls(2).Enabled = False
                    'SPRINT 11 INI  Limpar a célula quando não houver outra forma de finalidade de Crédito.
                    Sheets("CalculoFinanceiro").Range("DD13").Value = vbNullString
                    Sheets("CalculoFinanceiro").Range("DD14").Value = vbNullString
                    Sheets("CalculoFinanceiro").Range("DD15").Value = vbNullString
                    Sheets("CalculoFinanceiro").Range("DD16").Value = vbNullString
                    Sheets("CalculoFinanceiro").Range("D17").Value = "Não"
                    calcularAmortizacao_2 1
                    'SPRINT 11 FIM
                End If
'            ElseIf Not BooFin Then
'              CommandBars("Plan_PRONAFA2").Controls(11).Enabled = True
'              Set oBotao = CommandBars("Plan_PRONAFA2").FindControl(Type:=msoControlPopup, Tag:="mnuFinanc")
'              oBotao.Controls(1).Caption = "Finalidade 01"
'              oBotao.Controls(1).Enabled = True
'              oBotao.Controls(2).Caption = "Finalidade 02"
'              oBotao.Controls(2).Enabled = False
            Else
              CommandBars("Plan_PRONAFA2").Controls(11).Enabled = False
              Set oBotao = CommandBars("Plan_PRONAFA2").FindControl(Type:=msoControlPopup, Tag:="mnuFinanc")
              oBotao.Controls(1).Caption = "Finalidade 01"
              oBotao.Controls(1).Enabled = False
              oBotao.Controls(2).Caption = "Finalidade 02"
              oBotao.Controls(2).Enabled = False
            End If
        End If
        
       Set protPlan = Nothing
       Application.Calculation = xlAutomatic
End Sub

Private Sub Worksheet_Deactivate()

'   Dim xlPlan As String    Plano Safra 2016/2017 - Retirada por ficar muito demorado
'   If flagTela = 1 Then
'      Application.ScreenUpdating = False
'      xlPlan = ActiveSheet.Name
'      xl04Crono.Activate
'      AtualizaTela 1
'      flagTela = 0
'      Sheets([xlPlan]).Activate
'     ' Application.ScreenUpdating = True
'   End If


End Sub
