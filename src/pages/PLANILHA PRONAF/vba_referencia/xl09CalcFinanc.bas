Attribute VB_Name = "xl09CalcFinanc"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True

'Private Sub Worksheet_SelectionChange(ByVal Target As Range)
'        If Target.Row >= 12 And Target.Row <= 35 _
'           And Target.Column >= 9 Then
'           Range("I12:Q35").Interior.ColorIndex = 15
'           Range("I" & Target.Row & ":Q" & Target.Row).Interior.ColorIndex = 48
'        End If
'End Sub
'

Private Sub Worksheet_Activate()
        If ActiveSheet.Name <> "CalculoFinanceiro" Then Exit Sub

        On Error Resume Next
        CommandBars("Plan_PRONAFA2").Controls(5).Enabled = False
        CommandBars("Plan_PRONAFA2").Controls(7).Enabled = False
        CommandBars("Plan_PRONAFA2").Controls(8).Enabled = False
        CommandBars("Plan_PRONAFA2").Controls(11).Enabled = True
        
        If xl04Crono.Range("AR217").Value = 0 And xl04Crono.Range("AR219").Value = 0 Then
          CommandBars("Plan_PRONAFA2").Controls(11).Enabled = False
        Else
          CommandBars("Plan_PRONAFA2").Controls(11).Enabled = True
        End If
        
        Set oBotao = CommandBars("Plan_PRONAFA2").FindControl(Type:=msoControlPopup, Tag:="mnuFinanc")
        
         If Range("D311").Value = "" Then
              'Botão de Financiamento
              CommandBars("Plan_PRONAFA2").Controls(11).Enabled = True
            Else
              CommandBars("Plan_PRONAFA2").Controls(11).Enabled = False
              Set oBotao = CommandBars("Plan_PRONAFA2").FindControl(Type:=msoControlPopup, Tag:="mnuFinanc")
              oBotao.Controls(1).Caption = "Finalidade 01"
              oBotao.Controls(1).Enabled = False
              oBotao.Controls(2).Caption = "Finalidade 02"
              oBotao.Controls(2).Enabled = False
            End If
        
        'Sempre abrir no 01 cálculo
        Range("A2:FV2").EntireColumn.Hidden = True
        
        If xl04Crono.Range("AR217").Value = 0 And xl04Crono.Range("AR219").Value = 0 Then
          CalcFin = 0
        ElseIf xl04Crono.Range("AR217").Value = 0 And xl04Crono.Range("AR219").Value <> 0 Then
          CalcFin = 1
        ElseIf xl04Crono.Range("AR217").Value <> 0 And xl04Crono.Range("AR219").Value = 0 Then
          CalcFin = 0
        End If
        
        If CalcFin = 0 Then
          ExibeApl1
        Else
          ExibeApl2
        End If
        
        If Range("D311").Value = "" Then
           'Botão de Financiamento
           CommandBars("Plan_PRONAFA2").Controls(11).Enabled = True
           If xl04Crono.Range("AR217").Value <> 0 Then
               oBotao.Controls(1).Caption = "Finalidade: " & xl04Crono.Range("AR217").Value
               oBotao.Controls(1).Enabled = True
               calcularAmortizacao
           Else
               oBotao.Controls(1).Caption = "Finalidade 01"
               oBotao.Controls(1).Enabled = False
               Range("D13").Value = vbNullString
               'calcularAmortizacao
           End If
           If xl04Crono.Range("AR219").Value <> 0 Then
               oBotao.Controls(2).Caption = "Finalidade: " & xl04Crono.Range("AR219").Value
               oBotao.Controls(2).Enabled = True
               calcularAmortizacao_2 'RTC 31115 - Plano Safra 2016/2017
           Else
               oBotao.Controls(2).Caption = "Finalidade 02"
               oBotao.Controls(2).Enabled = False
               Range("DD13").Value = vbNullString
               'calcularAmortizacao_2 'RTC 31115 - Plano Safra 2016/2017
           End If
         End If
         Pinta_CalculoFinanceiro
         AtualizaTela
         flagBusca = 0
         flagTela = 1
End Sub

Private Sub Worksheet_Calculate()
'        cmdCalcula
        If ActiveSheet.Name <> "CalculoFinanceiro" Then Exit Sub
        If ActiveCell.Address = "$D$17" Then
           Range("D18").Select
           AtualizaTela
           calcularAmortizacao
        ElseIf ActiveCell.Address = "$DD$17" Then
           Range("DD18").Select
           AtualizaTela
           calcularAmortizacao_2  'RTC 31115 - Plano Safra 2016/2017
        End If
End Sub

Private Sub Worksheet_Deactivate()

   Dim xlPlan As String

    If flagTela = 1 Then
      Application.ScreenUpdating = False
      xlPlan = ActiveSheet.Name
      xl09CalcFinanc.Activate
      flagTela = 0
      Sheets([xlPlan]).Activate
      'Application.ScreenUpdating = True
    End If

    On Error Resume Next
    CommandBars("Plan_PRONAFA2").Controls(5).Enabled = True
    CommandBars("Plan_PRONAFA2").Controls(7).Enabled = True
    CommandBars("Plan_PRONAFA2").Controls(8).Enabled = True
    CommandBars("Plan_PRONAFA2").Controls(11).Enabled = False
    
End Sub


