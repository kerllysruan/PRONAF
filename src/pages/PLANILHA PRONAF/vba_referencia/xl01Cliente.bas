Attribute VB_Name = "xl01Cliente"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Private Sub Worksheet_Activate()

 
       
    ' joris bane
' alterado dia 20.03.2026

 On Error Resume Next
    Me.Unprotect Password:="senhasBNxl"
    Me.Range("E15,E75,E83,E106,E113,E120,E127,E133").NumberFormat = "@"
    Me.Protect Password:="senhasBNxl"
    On Error GoTo 0
    



        
       'E15, E75, E83, E106 E113 E120 E127 E134

       
       
     ' FIM DE INCLUSAO
        
        
        Dim oBotao
        Dim protPlan As clsProtecao
        Set protPlan = New clsProtecao
        If ActiveSheet.Name <> "Cliente" Then Exit Sub
        'ActiveSheet.ScrollArea = "A1:G130"
        
        ActiveSheet.ScrollArea = ""
        On Error Resume Next
        CommandBars("Plan_PRONAFA2").Controls(5).Enabled = False
        CommandBars("Plan_PRONAFA2").Controls(7).Enabled = False
        CommandBars("Plan_PRONAFA2").Controls(8).Enabled = False
        protPlan.ProtegePlanilha
        Set protPlan = Nothing
                
Saida:
    On Error Resume Next
    Application.EnableEvents = True
    Exit Sub

TrataErro:
   '' MsgBox "Erro no Worksheet_Change: " & Err.Description, vbExclamation
    Resume Saida

        
        
        
End Sub

Private Sub Worksheet_Change(ByVal Target As Range)

    Dim protPlan As clsProtecao
    Dim rngDocs As Range
    
    On Error GoTo TrataErro

    If Target Is Nothing Then GoTo Saida
    If Target.CountLarge > 1 Then GoTo Saida
    
    Set rngDocs = Intersect(Target, Me.Range("E15,E75,E106,E113"))
    
    If Not rngDocs Is Nothing Then
        Application.EnableEvents = False
        Me.Unprotect Password:="senhasBNxl"
        
        ProcessarDocumento rngDocs.Cells(1, 1)
        
        GoTo Saida
    End If

    If ActiveSheet.Name <> "Cliente" Then GoTo Saida
    If flagBusca = 1 Then GoTo Saida

    Set protPlan = New clsProtecao

    If Left(Target.Address, 5) = "$E$24" Then
       If Range("E24").Value = vbNullString Then GoTo Saida
       protPlan.IniciaRotina False
       flagBusca = 1
       celBusca = Range("E24").Value
       planBusca = ActiveSheet.Name
       resBusca = "E24"
       BuscaNaturalidade
       protPlan.FinalizaRotina
       Set protPlan = Nothing
       GoTo Saida
    End If
        
    If Left(Target.Address, 5) = "$E$29" Then
       If Range("E29").Value = vbNullString Then GoTo Saida
       protPlan.IniciaRotina False
       flagBusca = 1
       celBusca = Range("E29").Value
       planBusca = ActiveSheet.Name
       resBusca = "E29"
       BuscaAtividade
       protPlan.FinalizaRotina
       Set protPlan = Nothing
       GoTo Saida
    End If
        
    If Left(Target.Address, 5) = "$E$44" Then
       If Range("E44").Value = vbNullString Then GoTo Saida
       protPlan.IniciaRotina False
       flagBusca = 1
       celBusca = Range("E44").Value
       planBusca = ActiveSheet.Name
       resBusca = "E44"
       BuscaTipoLogradouro
       protPlan.FinalizaRotina
       Set protPlan = Nothing
       GoTo Saida
    End If
        
    If Left(Target.Address, 5) = "$E$58" Then
       If Range("E58").Value = vbNullString Then GoTo Saida
       protPlan.IniciaRotina False
       flagBusca = 1
       celBusca = Range("E58").Value
       planBusca = ActiveSheet.Name
       resBusca = "E58"
       BuscaTipoLogradouro
       protPlan.FinalizaRotina
       Set protPlan = Nothing
       GoTo Saida
    End If
        
    If Left(Target.Address, 5) = "$E$50" Then
       If Range("E50").Value = vbNullString Then GoTo Saida
       protPlan.IniciaRotina False
       flagBusca = 1
       celBusca = Range("E50").Value
       planBusca = ActiveSheet.Name
       resBusca = "E50"
       BuscaMunicipio
       protPlan.FinalizaRotina
       Set protPlan = Nothing
       GoTo Saida
    End If
        
    If Left(Target.Address, 5) = "$E$64" Then
       If Range("E64").Value = vbNullString Then GoTo Saida
       protPlan.IniciaRotina False
       flagBusca = 1
       celBusca = Range("E64").Value
       planBusca = ActiveSheet.Name
       resBusca = "E64"
       BuscaMunicipio
       protPlan.FinalizaRotina
       Set protPlan = Nothing
       GoTo Saida
    End If
        
    If Left(Target.Address, 5) = "$E$95" Then
       If Range("E95").Value = vbNullString Then GoTo Saida
       protPlan.IniciaRotina False
       flagBusca = 1
       celBusca = Range("E95").Value
       planBusca = ActiveSheet.Name
       resBusca = "E95"
       BuscaNaturalidade
       protPlan.FinalizaRotina
       Set protPlan = Nothing
       GoTo Saida
    End If

Saida:
    On Error Resume Next
    If Not protPlan Is Nothing Then Set protPlan = Nothing
    Me.Protect Password:="senhasBNxl"
    Application.EnableEvents = True
    Exit Sub

TrataErro:
  ''  MsgBox "Erro no Worksheet_Change: " & Err.Number & " - " & Err.Description, vbExclamation
    Resume Saida

End Sub

Private Sub Worksheet_Calculate()
        If ActiveSheet.Name <> "Cliente" Then Exit Sub
        If flagBusca = 1 Then Exit Sub
'- Dados para pessoa física ou jurídica
        Dim protPlan As clsProtecao
        Set protPlan = New clsProtecao
        
        
        If ActiveCell.Address = "$E$12" Then
           flagBusca = 1
           protPlan.IniciaRotina False
           If Range("Y12").Value = 2 Then 'Pessoa jurídica
           ' PESSOA JURIDICA ESTÁ  EM E15, ASSIM MODIFIQUEI ABAIXO
           ' JORIS BANE
           ' 10.03.2026
           
          '   Range("E15").NumberFormat = "00"".""000"".""000""/""0000-00"
              
              
             '' Range("E15").NumberFormat = "@"


                            
   '' xxx fim de código - JORIS BANE - CNPJ 10.03.2026
   
              Range("E20:E28").ClearContents
              Range("E32:E33").ClearContents
              Range("E82:E97").ClearContents
              Rows("20:28").Hidden = True
              Rows("37").Hidden = False
              Rows("32:33").Hidden = True
              Rows("80:98").Hidden = True
              Rows("103:110").Hidden = False
           Else
           ' ENTÃO SE FOR PESSOA FÍSICA
           ' FORMATA CONFORME BAIXO
           ' JORIS
           
           
              Rows("20:28").Hidden = False
              Rows("37").Hidden = True
              Rows("32:33").Hidden = False
              Range("E106:E137").ClearContents
              Rows("103:138").Hidden = True
            '  Range("E15").NumberFormat = "000"".""000"".""000-00"
           End If
           flagBusca = 0
           protPlan.FinalizaRotina
        End If
'-
'- Cadastra cônjuge / companheiro(a) de acordo com o estado civil
        If ActiveCell.Address = "$E$26" Then
           flagBusca = 1
           protPlan.IniciaRotina False
           If Left(Range("E26").Value, 9) = "Casado(a)" _
              Or Left(Range("E26").Value, 5) = "União" Then
              Range("A80:A98").EntireRow.Hidden = False
              Range("E91").Value = Range("E26").Value
           Else
              Range("E82:E97").ClearContents
              Range("A80:A98").EntireRow.Hidden = True
           End If
           Range("E27").Select
           flagBusca = 0
           protPlan.FinalizaRotina
           Set protPlan = Nothing
           Exit Sub
        End If
'-
        If ActiveCell.Address = "$E$73" Then
           flagBusca = 1
           protPlan.IniciaRotina False
           If UCase(ActiveCell.Value) = "PROPRIETÁRIO(A)" Then
              Range("E74").Value = Range("E13").Value
              Range("E75").Value = Range("E15").Value
              Range("E75").NumberFormat = Range("E15").NumberFormat
           End If
           protPlan.FinalizaRotina
           flagBusca = 0
           Set protPlan = Nothing
           Exit Sub
        End If
        Set protPlan = Nothing
End Sub

Public Sub btnCopiarEnderecoAtivParaCorresp_Click()
    ' Copia os valores do endereço de atividade para o endereço de
    ' correspondência.
    
    ' transformei em botão comum evitar erro em tempo de excução
    ' Joris dia 07.04
    ' de privado para públic
    
    
    Range("E58").Value = Range("E44").Value
    Range("E59").Value = Range("E45").Value
    Range("E60").Value = Range("E46").Value
    Range("E61").Value = Range("E47").Value
    Range("E62").Value = Range("E48").Value
    Range("E63").Value = Range("E49").Value
    Range("E64").Value = Range("E50").Value
    Range("E65").Value = Range("E51").Value
    Range("E66").Value = Range("E52").Value
End Sub

Private Sub Worksheet_Deactivate()
        On Error Resume Next
        CommandBars("Plan_PRONAFA2").Controls(5).Enabled = True
        CommandBars("Plan_PRONAFA2").Controls(7).Enabled = True
        CommandBars("Plan_PRONAFA2").Controls(8).Enabled = True
End Sub
