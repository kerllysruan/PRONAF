Attribute VB_Name = "mdlAtualiza"
Sub AtualizaTela(Optional intFlag As Integer)
    Dim lngLin As Long, lngLinCel As Long, intLinGar As Long
    Dim strTela As String, strColVal As String
    Dim protPlan As clsProtecao
    Dim rAreaImovel As Range, rAreaDados As Range
    Dim rAreaImv As Variant, rAreaImvInst As Variant, rAreaDadExpl As Variant, rAreaDadInst As Variant
          
    Application.ScreenUpdating = False
    
    Set protPlan = New clsProtecao
    
    protPlan.IniciaRotina True
    
    If ActiveSheet.Name = "Cliente" Then
       flagBusca = 1
       protPlan.IniciaRotina False
       Range("C1:C6").EntireRow.Hidden = True
       Range("C4:C6").EntireRow.Hidden = False
       If Range("Y12").Value = 2 Then 'Pessoa jurídica
       'Fiz a substituição abaixo
       ' dia 06.03.2026 - ALFANUMERICO
       ' JORIS Bane
       ' troquei de Range("E13").NumberFormat para .text
       
       
   
       
          ''Range("E15").NumberFormat = "00"".""000"".""000""/""0000-00"
          ''Range("E13").Value = CNPJAlfa_Formatarvalido(Range("E13").Value)
          
          Range("E20:E28").ClearContents
          Range("E32:E33").ClearContents
          Range("E82:E97").ClearContents
          Rows("20:28").Hidden = True
          Rows("37").Hidden = False
          Rows("32:33").Hidden = True
          Rows("80:98").Hidden = True
          Rows("103:110").Hidden = False
       Else
          Rows("20:28").Hidden = False
          Rows("37").Hidden = True
          Rows("32:33").Hidden = False
          Range("E106:E137").ClearContents
          Rows("103:138").Hidden = True
          Range("E15").NumberFormat = "000000000-00"
'- exibe cônjuge / companheiro(a) de acordo com o estado civil
          If Left(Range("E26").Value, 9) = "Casado(a)" _
             Or Left(Range("E26").Value, 5) = "União" Then
             Range("A80:A98").EntireRow.Hidden = False
             Range("E91").Value = Range("E26").Value
          Else
             Range("E82:E97").ClearContents
             Range("A80:A98").EntireRow.Hidden = True
          End If
       End If
       flagBusca = 0
    End If
    
    If ActiveSheet.Name = "Avaliação" Then
        rAreaDadExpl = Array(Union(Range("G17:K26"), Range("G28:K37"), Range("E38:F40"), Range("J43")), _
                           Union(Range("G77:K86"), Range("G88:K97"), Range("E98:F100"), Range("J103")), _
                           Union(Range("G137:K146"), Range("G148:K157"), Range("E158:F160"), Range("J163")))
        
        rAreaDadInst = Array(Range("D49:K68"), _
                             Range("D109:K128"), _
                             Range("D169:K188"))
                           
        rAreaImvInst = Array(Union(Range("D46:K69"), Range("D190:D232"), Range("D291:D293"), Range("D294:D296"), Range("D300:D302"), Range("D306:D310")), _
                             Union(Range("D106:K129"), Range("D297"), Range("D311:D314")), _
                             Union(Range("D166:K189"), Range("D298"), Range("D315:D318")))
                           
        rAreaImv = Array(Union(Range("D11:D69"), Range("D190:D232"), Range("D291:D293"), Range("D294:D299"), Range("D313:D321")), _
                            Union(Range("D70:D129"), Range("D297"), Range("D311:D314")), _
                            Union(Range("D130:D189"), Range("D298"), Range("D315:D318")))
    
       For intLinGar = 7 To 9
           'exibe a avaliação completa
           'If Range("Y" & [intLinGar]).Value = 1 Then
              Set rAreaDados = rAreaDadExpl(intLinGar - 7)
              Set rAreaImovel = rAreaImv(intLinGar - 7)
              
              rAreaDados.Select
              With Selection.Interior
                   .ColorIndex = xlNone
              End With
              Selection.Locked = False
              
              If intLinGar > 7 Then
                 If Cells([intLinGar], "D").Value = "" Then
                    Cells([intLinGar], "D").EntireRow.Hidden = True
                    rAreaImovel.EntireRow.Hidden = True
                 Else
                    Cells([intLinGar], "D").EntireRow.Hidden = False
                    rAreaImovel.EntireRow.Hidden = False
                 End If
              Else
                 rAreaImovel.EntireRow.Hidden = False
              End If
              Set rAreaDados = Nothing
              Set rAreaImovel = Nothing
           'End If
       Next intLinGar
       
       Call MascaraCPFCNPJ  ' CPF/CNPJ DO PROPRIETÁRIO
       
'       If Cells(8, "D").Value <> "" Then
'          Range("E70:E129").Rows.Hidden = True
'          Range("E70:E80").Rows.Hidden = False
'          Range("E87:E91").Rows.Hidden = False
'          Range("E98:E112").Rows.Hidden = False
'          Range("E129:E129").Rows.Hidden = False
'          Range("E299:E302").Rows.Hidden = False
'       End If
'       If Cells(9, "D").Value <> "" Then
'          Range("E130:E189").Rows.Hidden = True
'          Range("E130:E139").Rows.Hidden = False
'          Range("E147:E150").Rows.Hidden = False
'          Range("E158:E170").Rows.Hidden = False
'          Range("E189:E189").Rows.Hidden = False
'          Range("E303:E306").Rows.Hidden = False
'       End If
        
       For lngLin = 18 To 26
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 29 To 37
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 50 To 68
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 78 To 86
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 89 To 97
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 110 To 128
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 138 To 146
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 149 To 157
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 170 To 188
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 194 To 202
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 208 To 216
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       For lngLin = 222 To 230
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next
       If Range("A244").Value = "Verdadeiro" Then
          Range("E244:K252").Select
          Selection.EntireRow.Hidden = False
       Else
          Range("E244:K252").Select
          Selection.ClearContents
          Selection.EntireRow.Hidden = True
       End If
       If Range("A253").Value = "Verdadeiro" Then
          Range("E253:K261").Select
          Selection.EntireRow.Hidden = False
       Else
          Range("E253:K261").Select
          Selection.ClearContents
          Selection.EntireRow.Hidden = True
       End If
       If Range("A262").Value = "Verdadeiro" Then
          Range("E262:K268").Select
          Selection.EntireRow.Hidden = False
       Else
          Range("E262:K268").Select
          Selection.ClearContents
          Selection.EntireRow.Hidden = True
       End If
       If Range("A269").Value = "Verdadeiro" Then
          Range("E269:K275").Select
          Selection.EntireRow.Hidden = False
       Else
          Range("E269:K275").Select
          Selection.ClearContents
          Selection.EntireRow.Hidden = True
       End If
       If Range("A276").Value = "Verdadeiro" Then
          For lngLin = 279 To 289
              If Range("A" & [lngLin]).Value = "Sim" Then
                 Rows([lngLin]).Hidden = True
              Else
                 Rows([lngLin]).Hidden = False
              End If
          Next lngLin
          
          Range("E276:K289").Select
          Selection.EntireRow.Hidden = False
       Else
          Range("E276:K289").Select
          Selection.ClearContents
          Selection.EntireRow.Hidden = True
       End If
       For lngLin = 8 To 9
           If Cells(lngLin, "D").Value = "" Then
              Cells(lngLin, "D").EntireRow.Hidden = True
           Else
              Cells(lngLin, "D").EntireRow.Hidden = False
           End If
       Next

' RTC 1207004
       For lngLin = 297 To 299
           If Cells(lngLin, "D").Value = "" Then
                Union(Range(Cells(lngLin, "E"), Cells(lngLin, "K")), Range(Cells(lngLin + 6, "E"), Cells(lngLin + 6, "K"))).Select
                Selection.ClearContents
                Selection.EntireRow.Hidden = True
           Else
                Union(Range(Cells(lngLin, "E"), Cells(lngLin, "K")), Range(Cells(lngLin + 6, "E"), Cells(lngLin + 6, "K"))).Select
                Selection.EntireRow.Hidden = True
           End If
       Next
       

       'ajusta exibição de instalações e exploração considerando a garantia
       'GSOL00073365 - exibir sempre ajustado parametro na VISAO
       For intLinGar = 7 To 9
           If Range("Y" & [intLinGar]).Value = 0 Then
              'bloqueia acesso aos valores da exploração
              Set rAreaDados = rAreaDadExpl(intLinGar - 7)
              rAreaDados.Select
              With Selection.Interior
                   .ColorIndex = 15
                   .Pattern = xlSolid
              End With
              Selection.ClearContents
              Selection.Locked = True
              Set rAreaDados = Nothing

              'oculta instalações dos imóveis
              Set rAreaImovel = rAreaImvInst(intLinGar - 7)
              Set rAreaDados = rAreaDadInst(intLinGar - 7)
              rAreaDados.Select
              rAreaDados.ClearContents
              rAreaImovel.EntireRow.Hidden = True
              Set rAreaDados = Nothing
              Set rAreaImovel = Nothing
           End If
       Next intLinGar
       
'RTC 1207004
'        Range("E296:F299").Select
'        Selection.NumberFormat = "000000000"
'        Range("G296:H299").Select
'        Selection.NumberFormat = "000000000000"
'        Range("I296:I299").Select
'        Selection.NumberFormat = "0000000000000"
'        Range("J296:K299").Select
'        Selection.NumberFormat = "@"
'        Range("L296:L299").Select
'        Selection.NumberFormat = "@"
'        Range("M296:M299").Select
'        Selection.NumberFormat = "@"
'        Range("J296:K299").Select
'        Selection.NumberFormat = "@"
       ' Range("J302:K304").Select
       ' Selection.NumberFormat = "##0,00"
        
       
       '-
       Range("C4").Select
    End If
    
    
    If ActiveSheet.Name = " Proposta" Then
       If flagBusca = 1 Then GoTo Fim
       'TESTE
       'If Range("AN6").Value <> Range("E6").Value Then
       '   Range("E6").Value = Range("AN6").Value
       'End If
       
       For lngLin = 19 To 21
           If Range("A" & [lngLin]).Value = "Sim" Then
              Rows([lngLin]).Hidden = True
           End If
           If Range("A" & [lngLin]).Value = "Não" Then
              Rows([lngLin]).Hidden = False
           End If
       Next lngLin
       For lngLin = 27 To 62

           If Range("A" & [lngLin]).Value = "Sim" Then
              Range("D" & [lngLin]).EntireRow.Hidden = True
           End If
           If Range("A" & [lngLin]).Value = "Não" Then
              Range("D" & [lngLin]).EntireRow.Hidden = False
           End If
       Next lngLin
       For lngLin = 130 To 133
           If Range("A" & [lngLin]).Value = "Sim" Then
              Range("D" & [lngLin]).EntireRow.Hidden = True
           End If
           If Range("A" & [lngLin]).Value = "Não" Then
              Range("D" & [lngLin]).EntireRow.Hidden = False
           End If
       Next lngLin

       For lngLin = 140 To 144
           If Range("A" & [lngLin]).Value = "Sim" Then
              Rows([lngLin]).Hidden = True
           End If
           If Range("A" & [lngLin]).Value = "Não" Then
              Rows([lngLin]).Hidden = False
           End If
       Next lngLin

       If Range("Y161").Value = 1 Then
          Range("D166:P173").ClearContents
          protPlan.DesprotegePlanilha
          Range("165:173").EntireRow.Hidden = True
       Else
          Rows("165:173").Hidden = False
          For lngLin = 166 To 173
              If Range("A" & [lngLin]).Value = "Sim" Then
                 Rows([lngLin]).Hidden = True
              End If
              If Range("A" & [lngLin]).Value = "Não" Then
                 Rows([lngLin]).Hidden = False
              End If
          Next lngLin
       End If
       
       'Inclusão de lista de imóveis impedindo de alocar imóvel errado.
       Dim Icont As Integer
       Icont = 0
       For i = 0 To 2
         If xl02Aval.Range("AE" & 7 + i).Value <> "" Then
            If xl02Aval.Range("AE" & (7 + i)).Value <> xl03Prop.Range("AF" & (6 + Icont)).Value Then
              flagBusca = 1
              xl03Prop.Range("AF" & (7 + Icont)).Value = CInt(xl02Aval.Range("AE" & (7 + i)).Value)
              Icont = Icont + 1
            End If
         End If
       Next i
       flagBusca = 0
       
       If xl03Prop.Range("D22").Value <> "" Then
          xl03Prop.Range("AF" & 7 + Icont).Value = xl03Prop.Range("O22").Value
          Icont = Icont + 1
       End If
       
       If Icont = 0 Then
         ActiveWorkbook.Names.Add Name:="Imoveis_Inversao", RefersToR1C1:= _
                      "=' Proposta'!R7C32:R7C32"
       Else
         ActiveWorkbook.Names.Add Name:="Imoveis_Inversao", RefersToR1C1:= _
                      "=' Proposta'!R7C32:R" & [Icont] + 6 & "C32"
       End If
       
       If Range("E6").Value <> vbNullString Then ActiveWindow.Caption = ".:: PLANILHA PRONAF A - Versão 2.0 " '- " & Range("E6").Value

       'Forçar a pintar devido a problemas de manter a formatação
'        Range("D191:P191,D195:P195,D196:P196").Select
'        Range("D196").Activate
'        With Selection.Interior
'            .Pattern = xlSolid
'            .PatternColorIndex = xlAutomatic
'            .ThemeColor = xlThemeColorDark1
'            .TintAndShade = -0.249977111117893
'            .PatternTintAndShade = 0
'        End With
        xl03Prop.Range("E5").Select


       'GSOL00083049
       telaDeclPRONAF xl00Visao.Range("flagDecPRONAF").Value
    End If

    If ActiveSheet.Name = "Cronograma" Then
'RTC 1207004 (primeiro ')
'        Range("D129:D131").Select
'        With Selection
'            .HorizontalAlignment = xlGeneral
'            .VerticalAlignment = xlBottom
'            .WrapText = False
'            .Orientation = 0
'            .AddIndent = False
'            .IndentLevel = 0
'            .ShrinkToFit = False
'            .ReadingOrder = xlContext
'            .MergeCells = True
'        End With
'        Selection.UnMerge
'        With Selection
'            .HorizontalAlignment = xlCenter
'            .VerticalAlignment = xlBottom
'            .WrapText = False
'            .Orientation = 0
'            .AddIndent = False
'            .IndentLevel = 0
'            .ShrinkToFit = False
'            .ReadingOrder = xlContext
'            .MergeCells = False
'        End With
'        Selection.Merge
'        With Selection
'            .HorizontalAlignment = xlCenter
'            .VerticalAlignment = xlCenter
'            .WrapText = False
'            .Orientation = 0
'            .AddIndent = False
'            .IndentLevel = 0
'            .ShrinkToFit = False
'            .ReadingOrder = xlContext
'            .MergeCells = True
'        End With
'        With Selection.Interior
'            .Pattern = xlSolid
'            .PatternColorIndex = xlAutomatic
'            .ThemeColor = xlThemeColorDark1
'            .TintAndShade = -0.249977111117893
'            .PatternTintAndShade = 0
'        End With
'        Range("J129").Select
'        Range("J129").NumberFormat = "@"
'        Selection.Borders(xlDiagonalDown).LineStyle = xlNone
'        Selection.Borders(xlDiagonalUp).LineStyle = xlNone
'        Selection.Borders(xlEdgeLeft).LineStyle = xlNone
'        With Selection.Borders(xlEdgeTop)
'            .LineStyle = xlContinuous
'            .ColorIndex = 0
'            .TintAndShade = 0
'            .Weight = xlThin
'        End With
'        With Selection.Borders(xlEdgeBottom)
'            .LineStyle = xlContinuous
'            .ColorIndex = 0
'            .TintAndShade = 0
'            .Weight = xlThin
'        End With
'        Selection.Borders(xlEdgeRight).LineStyle = xlNone
'        Selection.Borders(xlInsideVertical).LineStyle = xlNone
'        Selection.Borders(xlInsideHorizontal).LineStyle = xlNone


        Range("D129:D131").Select
       If Range("A200").Value = 0 Then
           Application.ActiveSheet.Buttons.Delete
' RTC 1207004
'          ' Botão de limpeza  RNM - 25/09/2013
'            Set celula = ActiveSheet.Range("M5:N5")  'Sprint 11 04/2017 - 5 Parcela
'            Set btnLmp = ActiveSheet.Buttons.Add(celula.Left + 40, celula.Top + 5, celula.Width - 40, celula.Height)
'            btnLmp.OnAction = "LimpaCronograma": btnLmp.Caption = "Limpar Cronograma": btnLmp.Name = "Btn_cmdlimpa"
'
'            ' Botão de repetir dados : JSR - 23/09/2014
'            Set celula = ActiveSheet.Range("K5:L5")  'Sprint 11 04/2017 - 5 Parcela
'            Set btnRpt = ActiveSheet.Buttons.Add(celula.Left + 75, celula.Top + 5, celula.Width - 40, celula.Height)
'            btnRpt.OnAction = "cmdRepeteDados": btnRpt.Caption = "Copiar Dados": btnRpt.Name = "btnRepeteDados"
       End If
       lngLinCel = 187
       For lngLin = 202 To 239
            If Range("A" & [lngLin]).Value >= 1 Then
              If Range("A" & [lngLin]).Value = 1 Then
                Range("A" & [lngLin] - lngLinCel & ":A" & [lngLin] - lngLinCel + 2).EntireRow.Hidden = True
              Else
                Range("A" & [lngLin] - lngLinCel & ":A" & [lngLin] - lngLinCel + 2).EntireRow.Hidden = False
              End If
              Rows([lngLin]).Hidden = False
            Else
               Range("J" & [lngLin] - lngLinCel & ":N" & [lngLin] - lngLinCel).ClearContents
               Range("J" & [lngLin] - lngLinCel + 1 & ":M" & [lngLin] - lngLinCel + 1).ClearContents
               Range("A" & [lngLin] - lngLinCel & ":A" & [lngLin] - lngLinCel + 2).EntireRow.Hidden = True
               Rows([lngLin]).Hidden = True
            End If
        'Range("AB" & [lngLin]).NumberFormat = "@"
       '-
           lngLinCel = lngLinCel - 2
       Next lngLin
       
        If Range("A129").Value >= 1 Then
            Range("A129:A132").EntireRow.Hidden = False
            Range("A240").EntireRow.Hidden = False
        Else
            Range("J129").ClearContents
            Range("A129:A132").EntireRow.Hidden = True
            Range("A240").EntireRow.Hidden = True
        End If

       'Inclusão do item MDA E CFI GSOL00800821 - RNM INI
       For lngLin = 243 To 281
          If Range("A" & [lngLin]).Value >= 1 Then
              Rows([lngLin]).Hidden = False
           Else
              flagBusca = 1
              Range("L" & [lngLin]).Value = vbNullString
              Range("M" & [lngLin]).Value = vbNullString
              'RTC 31115 PLANO SAFRA 2016/2017 RNM INI ITEM 7
              If Range("D" & [lngLin]).Value <> "" And Range("G" & [lngLin]).Value = "" Then
                Range("G" & [lngLin]).Value = "INVESTIMENTOS FIXOS (1)"
              Else
                Range("G" & [lngLin]).Value = ""
              End If
              'RTC 31115 PLANO SAFRA 2016/2017 RNM FIM
              Rows([lngLin]).Hidden = True
           End If
       
       Next lngLin
'RTC 1207004 (primeiro ')
'       ' nova pronaf-a
'       If Range("G129").Value = 0 Then
'          Range("A240").EntireRow.Hidden = True
'          Range("A281").EntireRow.Hidden = True
'       Else
'          Range("A240").EntireRow.Hidden = False
'          Range("A281").EntireRow.Hidden = False
'       End If
'
'
'       protPlan.DesprotegePlanilha
'            Range("C4:R4").Select
'            With Selection
'                .HorizontalAlignment = xlCenter
'                .VerticalAlignment = xlBottom
'                .WrapText = False
'                .Orientation = 0
'                .AddIndent = False
'                .IndentLevel = 0
'                .ShrinkToFit = False
'                .ReadingOrder = xlContext
'                .MergeCells = True
'            End With
'            With Selection
'                .HorizontalAlignment = xlCenter
'                .VerticalAlignment = xlCenter
'                .WrapText = False
'                .Orientation = 0
'                .AddIndent = False
'                .IndentLevel = 0
'                .ShrinkToFit = False
'                .ReadingOrder = xlContext
'                .MergeCells = True
'            End With
'            With Selection.Font
'                .ThemeColor = xlThemeColorDark1
'                .TintAndShade = 0
'            End With
'            Selection.Font.Bold = True
'       protPlan.ProtegePlanilha
'       flagBusca = 0
'       'Inclusão do item MDA E CFI GSOL00800821 - RNM FIM
        flagBusca = 0
    End If
    
    If ActiveSheet.Name = "Ativ. Agrícola" Then
       Range("D7:D78").Rows.AutoFit
       Range("F8:F78").EntireColumn.AutoFit
       Range("H8:BN78").EntireColumn.AutoFit
       Range("D85:D119").Rows.AutoFit
       Range("K85:BN119").EntireColumn.AutoFit
       Range("D126:D160").Rows.AutoFit
       Range("I126:BN160").EntireColumn.AutoFit
       Range("A123:A161").EntireRow.Hidden = True
       If Range("A122").Value = 2 Then Range("A123:A125").EntireRow.Hidden = False
       
       lngLinCel = 7
       While lngLinCel <= 78
             If Range("A" & [lngLinCel]).Value = "Sim" Then
                If (lngLinCel > 38 And lngLinCel < 42) Or _
                   (lngLinCel > 74 And lngLinCel < 78) Then
                   Range("E" & [lngLinCel]).ClearContents
                End If
                'GSOL00277827 Range("F" & [lngLinCel] & ":" & "AL" & [lngLinCel]).ClearContents
                Range("F" & [lngLinCel] & ":" & "BN" & [lngLinCel]).ClearContents
                Range("E" & [lngLinCel]).EntireRow.Hidden = True
                If lngLinCel <= 42 Then
                   'GSOL00277827
                   Range("E" & [lngLinCel] + 77 & ":" & "AO" & [lngLinCel] + 77).ClearContents
                   Range("E" & [lngLinCel] + 77).EntireRow.Hidden = True
                   'GSOL00277827
                   Range("E" & [lngLinCel] + 118 & ":" & "BN" & [lngLinCel] + 118).ClearContents
                End If
             End If
             If Range("A" & [lngLinCel]).Value = "Não" Then
                Range("A" & [lngLinCel]).EntireRow.Hidden = False
                If lngLinCel <= 42 Then
                   Range("E" & [lngLinCel] + 77).EntireRow.Hidden = False
                   If Range("A122").Value = 2 Then Range("E" & [lngLinCel] + 118).EntireRow.Hidden = False
                End If
             End If
             lngLinCel = lngLinCel + 1
       Wend
       
       'escondendo as linhas referentes a atividade economica
       For i = 166 To 200
            If Range("D" & i).Value = "" Then
                Rows(i).Hidden = True
                Range("E" & i).Value = ""
            Else
                Rows(i).Hidden = False
            End If
       Next

'RTC 1207004 (primeiro ')
'        protPlan.DesprotegePlanilha
'
'
'         With Selection
'             .HorizontalAlignment = xlGeneral
'             .VerticalAlignment = xlBottom
'             .WrapText = False
'             .Orientation = 0
'             .AddIndent = False
'             .IndentLevel = 0
'             .ShrinkToFit = False
'             .ReadingOrder = xlContext
'             .MergeCells = True
'         End With
'         Selection.UnMerge
'         With Selection
'             .HorizontalAlignment = xlCenter
'             .VerticalAlignment = xlBottom
'             .WrapText = False
'             .Orientation = 0
'             .AddIndent = False
'             .IndentLevel = 0
'             .ShrinkToFit = False
'             .ReadingOrder = xlContext
'             .MergeCells = False
'         End With
'         With Selection
'             .HorizontalAlignment = xlCenter
'             .VerticalAlignment = xlCenter
'             .WrapText = False
'             .Orientation = 0
'             .AddIndent = False
'             .IndentLevel = 0
'             .ShrinkToFit = False
'             .ReadingOrder = xlContext
'             .MergeCells = False
'         End With
'         With Selection
'             .HorizontalAlignment = xlCenter
'             .VerticalAlignment = xlCenter
'             .WrapText = False
'             .Orientation = 0
'             .AddIndent = False
'             .IndentLevel = 0
'             .ShrinkToFit = False
'             .ReadingOrder = xlContext
'             .MergeCells = False
'         End With
'         Selection.Merge
'         Selection.Font.Bold = True
'         With Selection.Font
'             .ThemeColor = xlThemeColorDark1
'             .TintAndShade = 0
'         End With
'         protPlan.ProtegePlanilha

    End If
    
    If ActiveSheet.Name = "Ativ. Pecuária" Then
       If xl00Visao.Range("EI12").Value = 0 Then
          Range("A16").Value = 1
          Range("A38").Value = 1
          Range("A55").Value = 1
          Range("A71").Value = 1
          ActiveSheet.Shapes("cboBovLeit").Visible = False
          ActiveSheet.Shapes("cboBovCort").Visible = False
          ActiveSheet.Shapes("cboCaprin").Visible = False
          ActiveSheet.Shapes("cboOvin").Visible = False
          ActiveSheet.Shapes("fraAtvPecCusto").Visible = False
       Else
          ActiveSheet.Shapes("cboBovLeit").Visible = True
          ActiveSheet.Shapes("cboBovCort").Visible = True
          ActiveSheet.Shapes("cboCaprin").Visible = True
          ActiveSheet.Shapes("cboOvin").Visible = True
          ActiveSheet.Shapes("fraAtvPecCusto").Visible = True
       End If

       If Range("A15").Value > 0 Or _
          Range("A13").Value = True Then
          Range("D13:D34").EntireRow.Hidden = False
          ActiveSheet.Shapes("CaixaAtv_BovLeite").Select
          With Selection
               .Value = xlOn
          End With
          CustoPadrão_BovLeite
          Range("D2").Select
       End If
       protPlan.DesprotegePlanilha
       If Range("A37").Value > 0 Or _
          Range("A35").Value = True Then
          Range("D35:D51").EntireRow.Hidden = False
          ActiveSheet.Shapes("CaixaAtv_BovCorte").Select
          With Selection
               .Value = xlOn
          End With
          Range("D2").Select
          CustoPadrão_BovCorte
       End If
       protPlan.DesprotegePlanilha
       If Range("A54").Value > 0 Or _
          Range("A52").Value = True Then
          Range("D52:D67").EntireRow.Hidden = False
          ActiveSheet.Shapes("CaixaAtv_Ovino").Select
          With Selection
               .Value = xlOn
          End With
          CustoPadrão_Ovino
          Range("D2").Select
       End If
       protPlan.DesprotegePlanilha
       If Range("A70").Value > 0 Or _
          Range("A68").Value = True Then
          Range("D68:D82").EntireRow.Hidden = False
          ActiveSheet.Shapes("CaixaAtv_Caprino").Select
          With Selection
               .Value = xlOn
          End With
          CustoPadrão_Caprino
          Range("D2").Select
       End If
       lngLinCel = 137
       protPlan.DesprotegePlanilha
       While lngLinCel < 172
             If Range("A" & [lngLinCel]).Value = "Sim" Then
                Range("L" & [lngLinCel] & ":" & "R" & [lngLinCel]).ClearContents '
                Range("L" & [lngLinCel]).Select
                Selection.EntireRow.Hidden = True
             End If
             If Range("A" & [lngLinCel]).Value = "Não" Then
                Range("L" & [lngLinCel]).Select
                Selection.EntireRow.Hidden = False
             End If
             lngLinCel = lngLinCel + 1
       Wend
       Ativa_Pastagem
    End If
    If ActiveSheet.Name = "Outras Ativ" Then
       Range("D13:D24").EntireRow.AutoFit
       Range("D44:D55").EntireRow.AutoFit
       For lngLinCel = 13 To 24
           If Range("A" & [lngLinCel]).Value = 0 Then
              If lngLinCel > 14 Then
                 Range("D" & [lngLinCel] & ":" & "AJ" & [lngLinCel]).ClearContents 'GSOL00277827
                 Range("F" & [lngLinCel] + 31 & ":" & "AJ" & [lngLinCel] + 31).ClearContents
              End If
              Rows(lngLinCel).Hidden = True
              Rows(lngLinCel + 31).Hidden = True
           Else
              Rows(lngLinCel).Hidden = False
              Rows(lngLinCel + 31).Hidden = False
           End If
       Next lngLinCel
       
        'escondendo as linhas referentes as "outras atividades" não preenchidas.
       For i = 93 To 102
            If Range("D" & i).Value = "" Then
                Range("E" & i).Value = ""
                Rows(i).Hidden = True
            Else
                Rows(i).Hidden = False
            End If
       Next
       
       Range("M1:AJ1").EntireColumn.Hidden = True 'GSOL00277827
       If xl00Visao.Range("visaoHORIZ").Value > 6 Then
          For lngLinCel = 12 To 6 + xl00Visao.Range("visaoHORIZ").Value
              ActiveSheet.Cells(1, lngLinCel).Activate
              Selection.EntireColumn.Hidden = False
          Next lngLinCel
       End If
        
'RTC 1207004 (primeiro ')
'        protPlan.DesprotegePlanilha
'        With Selection
'            .HorizontalAlignment = xlGeneral
'            .VerticalAlignment = xlCenter
'            .WrapText = False
'            .Orientation = 0
'            .AddIndent = False
'            .IndentLevel = 0
'            .ShrinkToFit = False
'            .ReadingOrder = xlContext
'            .MergeCells = True
'        End With
'        With Selection
'            .HorizontalAlignment = xlCenter
'            .VerticalAlignment = xlCenter
'            .WrapText = False
'            .Orientation = 0
'            .AddIndent = False
'            .IndentLevel = 0
'            .ShrinkToFit = False
'            .ReadingOrder = xlContext
'            .MergeCells = True
'        End With
'        With Selection.Font
'            .ThemeColor = xlThemeColorDark1
'            .TintAndShade = 0
'        End With
'        Selection.Font.Bold = True
'        protPlan.ProtegePlanilha

       
       Range("D4").Select
    End If
    If ActiveSheet.Name = "Sup.Forrageiro" Then
       For lngLinCel = 6 To 47
           If Range("A" & [lngLinCel]).Value = "Sim" Then
              Range("A" & [lngLinCel]).EntireRow.Hidden = True
           Else
             If Trim(Cells(lngLinCel, "D").Value) = "" Then
                Cells(lngLinCel, "D").EntireRow.Hidden = True
             Else
                Cells(lngLinCel, "D").EntireRow.Hidden = False
             End If
             'Range("A" & [lngLinCel]).EntireRow.Hidden = False
           End If

       Next
       ' pronaf-a 20
       Range("A47").EntireRow.Hidden = True
       Range("A50:A57").EntireRow.Hidden = True
       
       'GSOL00982018 - Item 1 - Retirar esta validação para exibir as linhas. 9 Sprint
'       For lngLinCel = 55 To 58
'           If Trim(Cells(lngLinCel, "E").Value) = "" Then
'              Cells(lngLinCel, "E").EntireRow.Hidden = True
'           Else
'              Cells(lngLinCel, "E").EntireRow.Hidden = False
'           End If
'       Next
              
       'For lngLinCel = 8 To 11
       '    If Range("A" & [lngLinCel]).Value = "Sim" Then
       '       Range("A" & [lngLinCel]).EntireRow.Hidden = True
       '    Else
       '       Range("A" & [lngLinCel]).EntireRow.Hidden = False
       '    End If
       'Next lngLinCel
       Range("G1:AI1").EntireColumn.Hidden = True 'GSOL00277827
       If xl00Visao.Range("visaoHORIZ").Value > 1 Then
          For lngLinCel = 3 To 5 + xl00Visao.Range("visaoHORIZ").Value
              Cells(1, lngLinCel).EntireColumn.Hidden = False
          Next lngLinCel
       End If
       
'RTC 1207004 (primeiro ')
'       protPlan.DesprotegePlanilha
'        With Selection
'            .HorizontalAlignment = xlCenter
'            .VerticalAlignment = xlBottom
'            .WrapText = False
'            .Orientation = 0
'            .AddIndent = False
'            .IndentLevel = 0
'            .ShrinkToFit = False
'            .ReadingOrder = xlContext
'            .MergeCells = True
'        End With
'        With Selection
'            .HorizontalAlignment = xlCenter
'            .VerticalAlignment = xlCenter
'            .WrapText = False
'            .Orientation = 0
'            .AddIndent = False
'            .IndentLevel = 0
'            .ShrinkToFit = False
'            .ReadingOrder = xlContext
'            .MergeCells = True
'        End With
'        With Selection.Font
'            .ThemeColor = xlThemeColorDark1
'            .TintAndShade = 0
'        End With
'        Selection.Font.Bold = True
'        protPlan.ProtegePlanilha
       
       
    End If
    
    If ActiveSheet.Name = "CalculoFinanceiro" Then
'       If flagBusca = 1 Then Exit Sub
      If CalcFin = 0 Then
          Range("N12:N41").Interior.ColorIndex = 15 'GSOL00277827
          Range("N12:N41").Locked = True 'GSOL00277827
          If Range("X17").Value = 0 Then
             For lngLinCel = 12 To 41 'GSOL00277827
                 lngLin = lngLinCel - 11
                 If lngLin > Range("X13").Value Then Range("N" & [lngLinCel]).Value = 0
                 If lngLin > Range("X14").Value And _
                    lngLin <= Range("X13").Value Then
                    Range("N" & [lngLinCel]).Interior.ColorIndex = xlNone
                    Range("N" & [lngLinCel]).Locked = False
                 Else
                    Range("N" & [lngLinCel]).Value = 0
                 End If
             Next lngLinCel
           End If
               Columns("A:A").ColumnWidth = 1
               Columns("B:B").ColumnWidth = 1
               Columns("C:C").ColumnWidth = 23.29
               Columns("D:D").ColumnWidth = 9.57
               Columns("E:H").ColumnWidth = 1
               Columns("I:I").ColumnWidth = 4.29
               Columns("J:J").ColumnWidth = 10
               Columns("K:K").ColumnWidth = 11
               Columns("L:L").ColumnWidth = 9.71
               Columns("M:M").ColumnWidth = 5.57
               Columns("N:N").ColumnWidth = 11.71
               Columns("O:O").ColumnWidth = 10
               Columns("P:P").ColumnWidth = 8.86
               Columns("Q:Q").ColumnWidth = 11
               Columns("R:R").ColumnWidth = 1
               Columns("A:R").EntireColumn.AutoFit
            
               Range("C7:Q7").Select
               Selection.Font.Bold = True
               Selection.MergeCells = True
               Selection.HorizontalAlignment = xlCenter
               Selection.VerticalAlignment = xlCenter
               With Selection.Font
                    .Name = "Arial"
                    .Size = 12
                    .Strikethrough = False
                    .Superscript = False
                    .Subscript = False
                    .OutlineFont = False
                    .Shadow = False
                    .Underline = xlUnderlineStyleNone
                    .ThemeColor = xlThemeColorDark1
                    .TintAndShade = 0
                    .ThemeFont = xlThemeFontNone
               End With
               With Selection.Font
                   .ThemeColor = xlThemeColorDark1
                   .TintAndShade = 0
               End With
               Range("A1").Select
               ActiveWindow.SmallScroll Down:=0
               ActiveWindow.ScrollColumn = 1
          
      Else
          Range("DN12:DN41").Interior.ColorIndex = 15 'GSOL00277827
          Range("DN12:DN41").Locked = True 'GSOL00277827
          If Range("DX17").Value = 0 Then
             For lngLinCel = 12 To 41
                 lngLin = lngLinCel - 11
                 If lngLin > Range("DX13").Value Then Range("DN" & [lngLinCel]).Value = 0
                 If lngLin > Range("DX14").Value And _
                    lngLin <= Range("DX13").Value Then
                    Range("DN" & [lngLinCel]).Interior.ColorIndex = xlNone
                    Range("DN" & [lngLinCel]).Locked = False
                 Else
                    Range("DN" & [lngLinCel]).Value = 0
                 End If
             Next lngLinCel
           End If
               Columns("DA:DA").ColumnWidth = 1
               Columns("DB:DB").ColumnWidth = 1
               Columns("DC:DC").ColumnWidth = 23.29
               Columns("DD:DD").ColumnWidth = 9.57
               Columns("DE:DH").ColumnWidth = 1
               Columns("DI:DI").ColumnWidth = 4.29
               Columns("DJ:DJ").ColumnWidth = 10
               Columns("DK:DK").ColumnWidth = 11
               Columns("DL:DL").ColumnWidth = 9.71
               Columns("DM:DM").ColumnWidth = 5.57
               Columns("DN:DN").ColumnWidth = 11.71
               Columns("DO:DO").ColumnWidth = 10
               Columns("DP:DP").ColumnWidth = 8.86
               Columns("DQ:DQ").ColumnWidth = 11
               Columns("DR:DR").ColumnWidth = 1
               Columns("DA:DR").EntireColumn.AutoFit

               Range("DC7:DQ7").Select
               Selection.Font.Bold = True
               Selection.MergeCells = True
               Selection.HorizontalAlignment = xlCenter
               Selection.VerticalAlignment = xlCenter
               With Selection.Font
                    .Name = "Arial"
                    .Size = 12
                    .Strikethrough = False
                    .Superscript = False
                    .Subscript = False
                    .OutlineFont = False
                    .Shadow = False
                    .Underline = xlUnderlineStyleNone
                    .ThemeColor = xlThemeColorDark1
                    .TintAndShade = 0
                    .ThemeFont = xlThemeFontNone
               End With
               With Selection.Font
                   .ThemeColor = xlThemeColorDark1
                   .TintAndShade = 0
               End With
                
                Range("DC7:DQ7").Select
                Selection.Font.Bold = True
                With Selection
                    .HorizontalAlignment = xlCenter
                    .VerticalAlignment = xlBottom
                    .WrapText = False
                    .Orientation = 0
                    .AddIndent = False
                    .IndentLevel = 0
                    .ShrinkToFit = False
                    .ReadingOrder = xlContext
                    .MergeCells = True
                End With
                With Selection
                    .HorizontalAlignment = xlCenter
                    .VerticalAlignment = xlCenter
                    .WrapText = False
                    .Orientation = 0
                    .AddIndent = False
                    .IndentLevel = 0
                    .ShrinkToFit = False
                    .ReadingOrder = xlContext
                    .MergeCells = True
                End With
                With Selection.Font
                    .ThemeColor = xlThemeColorDark1
                    .TintAndShade = 0
                End With
'                Range("DI12").Select
'                ActiveWindow.SmallScroll Down:=12
'                Range("DI12:DQ41").Select
'                ActiveWindow.SmallScroll Down:=-9
'                With Selection.Interior
'                    .PatternColorIndex = xlAutomatic
'                    .ThemeColor = xlThemeColorDark1
'                    .TintAndShade = -0.249977111117893
'                    .PatternTintAndShade = 0
'                End With
'                With Selection.Font
'                    .Name = "Arial"
'                    .Size = 12
'                End With
'
'
'                Selection.Borders(xlDiagonalDown).LineStyle = xlNone
'                Selection.Borders(xlDiagonalUp).LineStyle = xlNone
'                With Selection.Borders(xlEdgeLeft)
'                    .LineStyle = xlContinuous
'                    .ColorIndex = 0
'                    .TintAndShade = 0
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlEdgeTop)
'                    .LineStyle = xlContinuous
'                    .ColorIndex = 0
'                    .TintAndShade = 0
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlEdgeBottom)
'                    .LineStyle = xlContinuous
'                    .ColorIndex = 0
'                    .TintAndShade = 0
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlEdgeRight)
'                    .LineStyle = xlContinuous
'                    .ColorIndex = 0
'                    .TintAndShade = 0
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlInsideVertical)
'                    .LineStyle = xlContinuous
'                    .ColorIndex = 0
'                    .TintAndShade = 0
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlInsideHorizontal)
'                    .LineStyle = xlContinuous
'                    .ColorIndex = 0
'                    .TintAndShade = 0
'                    .Weight = xlThin
'                End With
'                Selection.Borders(xlDiagonalDown).LineStyle = xlNone
'                Selection.Borders(xlDiagonalUp).LineStyle = xlNone
'                With Selection.Borders(xlEdgeLeft)
'                    .LineStyle = xlContinuous
'                    .ThemeColor = 1
'                    .TintAndShade = -0.349946592608417
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlEdgeTop)
'                    .LineStyle = xlContinuous
'                    .ThemeColor = 1
'                    .TintAndShade = -0.349946592608417
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlEdgeBottom)
'                    .LineStyle = xlContinuous
'                    .ThemeColor = 1
'                    .TintAndShade = -0.349946592608417
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlEdgeRight)
'                    .LineStyle = xlContinuous
'                    .ThemeColor = 1
'                    .TintAndShade = -0.349946592608417
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlInsideVertical)
'                    .LineStyle = xlContinuous
'                    .ThemeColor = 1
'                    .TintAndShade = -0.349946592608417
'                    .Weight = xlThin
'                End With
'                With Selection.Borders(xlInsideHorizontal)
'                    .LineStyle = xlContinuous
'                    .ThemeColor = 1
'                    .TintAndShade = -0.349946592608417
'                    .Weight = xlThin
'                End With
'
'                Range("DJ42:DQ42").Select
'                ActiveWindow.SmallScroll Down:=-9
'                With Selection.Interior
'                    .PatternColorIndex = xlAutomatic
'                    .ThemeColor = xlThemeColorDark1
'                    .TintAndShade = -0.349977111117893
'                    .PatternTintAndShade = 0
'                End With
'                With Selection.Font
'                    .Name = "Arial"
'                    .Size = 12
'                End With
'                Selection.NumberFormat = "0.00"
'                Selection.NumberFormat = "#,##0.00"
'
'                Range("DC12:DD18").Select
'                With Selection.Font
'                    .Name = "Arial"
'                    .Size = 12
'                End With
'
'                Range("DC10:DD18").Select
'                With Selection.Font
'                    .Name = "Arial"
'                    .Size = 12
'                End With
'
'                Range("DI10:DQ10").Select
'                With Selection.Font
'                    .Name = "Arial"
'                    .Size = 12
'                End With
'
'                Range("DC7:DQ7").Select
                ActiveWindow.SmallScroll Down:=0
                Range("A1").Select
      End If
      flagBusca = 1
    End If
    
    If ActiveSheet.Name = "Cap.Pgto" Then
       Range("F1:AG1").EntireColumn.Hidden = True 'GSOL00277827
       If xl00Visao.Range("visaoHORIZ").Value > 1 Then
          For lngLinCel = 3 To 3 + xl00Visao.Range("visaoHORIZ").Value
              Cells(1, lngLinCel).EntireColumn.Hidden = False
          Next lngLinCel
       End If
       
       protPlan.IniciaRotina
       Formata_RelCapPagamento
       protPlan.FinalizaRotina
              
       Range("B2").Activate
    End If

    If ActiveSheet.Name = "Rel_Receitas" Then
       Range("D13:D114").Rows.AutoFit
       Columns("E:AJ").EntireColumn.Select
       Columns("E:AJ").EntireColumn.EntireColumn.AutoFit
       Range("G1:AI1").EntireColumn.Hidden = True 'GSOL00277827
       If xl00Visao.Range("visaoHORIZ").Value > 1 Then
          For lngLinCel = 3 To 5 + xl00Visao.Range("visaoHORIZ").Value
              Cells(1, lngLinCel).EntireColumn.Hidden = False
          Next lngLinCel
       End If
       Range("A12").Select
       Selection.AutoFilter Field:=1, Criteria1:="1"
       Range("D3").Activate
    End If
    
    If ActiveSheet.Name = "Rel_Custos" Then
       Range("D13:D47").Rows.AutoFit
       Range("D49:D136").Rows.AutoFit
       Columns("E:AJ").EntireColumn.Select
       Columns("E:AJ").EntireColumn.EntireColumn.AutoFit
       Range("G1:AI1").EntireColumn.Hidden = True 'GSOL00277827
       If xl00Visao.Range("visaoHORIZ").Value > 1 Then
          For lngLinCel = 3 To 5 + xl00Visao.Range("visaoHORIZ").Value
              Cells(1, lngLinCel).EntireColumn.Hidden = False
          Next lngLinCel
       End If
       
       protPlan.IniciaRotina
       Formata_RelCustos

       Range("A12").Select
       Selection.AutoFilter Field:=1, Criteria1:="1"
       protPlan.FinalizaRotina
       Range("D3").Activate
    End If
    
    'GSOL00724908 - RNM  INCLUSÃO DE RELATÓRIO INI
    If ActiveSheet.Name = "EMPREE_REL" Then

        AjustaRelatorio 'solução para arrumar formatação
        
        'Acomodar a informação nas células
        Rows("10:48").Select
        Rows("10:48").EntireRow.AutoFit
        
        Rows("52:90").Select
        Rows("52:90").EntireRow.AutoFit
        
        Sheets("EMPREE_REL").Visible = xlSheetVisible
        Application.ScreenUpdating = False
        Dim INI, Fim As Byte
        
        Rows("10:47").Select
        Selection.EntireRow.Hidden = False

        Rows("52:89").Select
        Selection.EntireRow.Hidden = False
        
        
        For lngLinCel = 10 To 48
            If Range("B" & lngLinCel).Value = "" Then
               If INI = 0 Then
                  INI = lngLinCel
                  Fim = lngLinCel
               End If
               If Fim + 1 = lngLinCel Then Fim = lngLinCel
            Else
               If (INI <> 0) And (Fim <> 0) Then
                    Rows(INI & ":" & Fim).Select
                    Selection.EntireRow.Hidden = True
                     Rows(INI + 42 & ":" & Fim + 42).Select
                    Selection.EntireRow.Hidden = True
                    INI = 0
                    Fim = 0
               End If
            End If
            If lngLinCel = 48 Then
              If (INI <> 0) And (Fim <> 0) Then
                  Rows(INI & ":" & Fim).Select
                  Selection.EntireRow.Hidden = True
                  Rows(INI + 42 & ":" & Fim + 42).Select
                  Selection.EntireRow.Hidden = True
              End If
            End If
        Next lngLinCel
        
        'CATALOGO SICOR 19/08/2021 INICIO GSOL 600512
        Dim li_seq As Integer
        Dim lng_rel As Long
        'Atualiza tela
        Tela_RelSicor
        
        lng_rel = 101 'Inicio do relatorio do sicor
        'xl00RelEmpr.Range("A30:H374").ClearContents
        xl00RelEmpr.Range("B101").Value = "Inversão :- "
        xl00RelEmpr.Range("B104:J1000").Select
        Selection.EntireRow.Delete
        Selection.EntireRow.Delete
        'Imprimir todos os dados da ABA SICOR 15/07/2021
'        xl00RelEmpr.Range("A" & lngLinCel).Value = "INFORMAÇÕES COMPLEMENTARES DOS EMPREENDIMENTOS - CATÁLOGO SICOR"
        For li_sicor = 4 To 1000
            'Caso encontre Inversão, preencher cabeçalho
            If li_sicor = 4 Then 'Caso seja primeira inversão, não copiar cabeçalho
                If xlSicor.Range("C" & li_sicor).Value = "Inversão :- " Then 'Caso tenha achado inversão
                   xl00RelEmpr.Range("B" & lng_rel).Value = "Inversão :- " & xlSicor.Range("D" & li_sicor).Value 'Descrição inversão
                   'xl00RelEmpr.Range("B" & lng_rel).Value = Plan6.Range("D" & li_sicor).Value 'Descrição inversão
                   li_sicor = li_sicor + 1
                   lng_rel = lng_rel + 1
                   xl00RelEmpr.Range("C" & lng_rel).NumberFormat = "0.00"
                   xl00RelEmpr.Range("C" & lng_rel).Value = xlSicor.Range("E" & li_sicor).Value
                   li_sicor = li_sicor + 2
                   lng_rel = lng_rel + 2
                   
                   
                    ' JORIS - dia 08.06.2026
                   xl00RelEmpr.Range("D9:F9").Merge
                   xl00RelEmpr.Columns("H:H").ColumnWidth = 17.2
                   ' acerto no relatório empreendimento.
                   
                   
                   
                   
                End If
            Else
                'Se sequencia for nula, é porque não tem mais sequencia a mostrar, então sai do laço.
                If xlSicor.Range("A" & li_sicor).Value = "X" And xlSicor.Range("C" & li_sicor).Value = "Inversão :- " Then Exit For '19/08/2021
                'Copiar Cabeçalho antes de preencher inversão e percentual de Energia Renovável INICIO
                xl00RelEmpr.Range("B101:K103").Select
                Selection.Copy
                lng_rel = lng_rel + 1
                xl00RelEmpr.Range("B" & lng_rel).Select
                ActiveSheet.Paste
    
                'Copiar Cabeçalho antes de preencher inversão e percentual de Energia Renovável FINAL
                If xlSicor.Range("C" & li_sicor).Value = "Inversão :- " Then 'Caso tenha achado inversão
                   xl00RelEmpr.Range("B" & lng_rel).Value = "Inversão :- " & xlSicor.Range("D" & li_sicor).Value 'Descrição inversão
                   li_sicor = li_sicor + 1
                   lng_rel = lng_rel + 1
                   xl00RelEmpr.Range("C" & lng_rel).Value = xlSicor.Range("E" & li_sicor).Value
                   li_sicor = li_sicor + 2
                   lng_rel = lng_rel + 2
                End If
            End If
            'Pegar a sequencia do Item de Inversão para varrer até ultimo item preenchido
            li_seq = xlSicor.Range("X" & li_sicor).Value
            li_seq_prox = xlSicor.Range("X" & li_sicor).Value
            Do While li_seq = li_seq_prox
               If xlSicor.Range("A" & li_sicor).Value = "A" Then 'Porque tem dados, vai ser impresso
                  Borda_rel "B" & lng_rel & ":K" & lng_rel
                  Rows(lng_rel & ":" & lng_rel).RowHeight = 25.5
                  xl00RelEmpr.Range("B" & lng_rel & ":C" & lng_rel).NumberFormat = "@"
                  xl00RelEmpr.Range("B" & lng_rel & ":C" & lng_rel).MergeCells = True
                  xl00RelEmpr.Range("B" & lng_rel & ":C" & lng_rel).Value = xlSicor.Range("C" & li_sicor).Value
                  xl00RelEmpr.Range("B" & lng_rel & ":C" & lng_rel).WrapText = True
                  xl00RelEmpr.Range("D" & lng_rel & ":F" & lng_rel).NumberFormat = "@"
                  xl00RelEmpr.Range("D" & lng_rel & ":F" & lng_rel).MergeCells = True
                  xl00RelEmpr.Range("D" & lng_rel & ":F" & lng_rel).Value = xlSicor.Range("E" & li_sicor).Value
                  xl00RelEmpr.Range("G" & lng_rel & ":H" & lng_rel).NumberFormat = "@"
                  xl00RelEmpr.Range("G" & lng_rel & ":H" & lng_rel).MergeCells = True
                  xl00RelEmpr.Range("G" & lng_rel & ":H" & lng_rel).Value = xlSicor.Range("G" & li_sicor).Value
                  xl00RelEmpr.Range("G" & lng_rel & ":H" & lng_rel).WrapText = True
                  xl00RelEmpr.Range("I" & lng_rel & ":K" & lng_rel).NumberFormat = "@"
                  xl00RelEmpr.Range("I" & lng_rel & ":K" & lng_rel).MergeCells = True
                  xl00RelEmpr.Range("I" & lng_rel & ":K" & lng_rel).Value = xlSicor.Range("I" & li_sicor).Value
               End If
               li_sicor = li_sicor + 1
                'Só alterna a Linha se tiver dados. 17/07/2021
               If xlSicor.Range("C" & li_sicor).Value <> "" And xlSicor.Range("E" & li_sicor).Value <> "" And xlSicor.Range("G" & li_sicor).Value <> "" And xlSicor.Range("I" & li_sicor).Value <> "" Then
                  lng_rel = lng_rel + 1
               End If
               li_seq_prox = xlSicor.Range("X" & li_sicor).Value
            Loop
        Next
        'CATALOGO SICOR 19/08/2021 FINAL GSOL 600512
    End If
    'RNM - GSOL00724908 - INCLUSÃO DE RELATÓRIO FIM
    
    
    If ActiveSheet.Name = "Rel_Usos_Fontes" Then
       For lngLinCel = 18 To 63
           If Cells([lngLinCel], "H").Value > 0 Then
              Rows([lngLinCel]).Hidden = False
           Else
              Rows([lngLinCel]).Hidden = True
           End If
       Next lngLinCel
    End If
    'Sprint 11 04/2017
    If ActiveSheet.Name = "Coord.Geodesica" Then
        
       'Adequar o range das linhas de acordo com a quantidade de inversões
        protPlan.DesprotegePlanilha
        'CarregamentoRapido True
        For i = 21 To 80
            Range("G" & i).Locked = False
            Range("G" & i).Select
            Selection.NumberFormat = "0.00000000000_ ;[Red]-0.00000000000 "
            Selection.FormatConditions.Delete
            Selection.FormatConditions.Add Type:=xlExpression, Formula1:="=$S$" & i & "=-1"
            Selection.FormatConditions(Selection.FormatConditions.Count).SetFirstPriority
            With Selection.FormatConditions(1).Font
                .Bold = True
                .Italic = False
                .Color = -16776961
                .TintAndShade = 0
            End With
            Selection.FormatConditions(1).StopIfTrue = True
            Range("H" & i).Locked = False
            Range("H" & i).Select
            Selection.NumberFormat = "0.00000000000_ ;[Red]-0.00000000000 "
            Selection.FormatConditions.Delete
            Selection.FormatConditions.Add Type:=xlExpression, Formula1:="=$T$" & i & "=-1"
            Selection.FormatConditions(Selection.FormatConditions.Count).SetFirstPriority
            With Selection.FormatConditions(1).Font
                .Bold = True
                .Italic = False
                .Color = -16776961
                .TintAndShade = 0
            End With
            Selection.FormatConditions(1).StopIfTrue = True
            Range("I" & i).Locked = False
            Range("I" & i).Select
            Selection.NumberFormat = "0.00_ ;[Red]-0.00 "
            Selection.FormatConditions.Delete
            Selection.FormatConditions.Add Type:=xlExpression, Formula1:="=$U$" & i & "=-1"
            Selection.FormatConditions(Selection.FormatConditions.Count).SetFirstPriority
            With Selection.FormatConditions(1).Font
                .Bold = True
                .Italic = False
                .Color = -16776961
                .TintAndShade = 0
            End With
            Selection.FormatConditions(1).StopIfTrue = True
        Next i
        protPlan.FinalizaRotina
        
        protPlan.DesprotegePlanilha
        Range("C2:K2,AQ2:AU2").Select
        Range("AQ2").Activate
    
        With Selection.Font
            .ThemeColor = xlThemeColorDark1
            .TintAndShade = 0
        End With
        Selection.Font.Bold = True
        With Selection
            .HorizontalAlignment = xlCenter
            .VerticalAlignment = xlBottom
            .WrapText = False
            .Orientation = 0
            .AddIndent = False
            .IndentLevel = 0
            .ShrinkToFit = False
            .ReadingOrder = xlContext
        End With
        With Selection
            .HorizontalAlignment = xlCenter
            .VerticalAlignment = xlCenter
            .WrapText = False
            .Orientation = 0
            .AddIndent = False
            .IndentLevel = 0
            .ShrinkToFit = False
            .ReadingOrder = xlContext
        End With
        protPlan.ProtegePlanilha
        Range("E4").Select
        
        
        
        
    End If
    
    ' Inclusão do Catálogo SICOR - RNM - INI 12/07/2022
    If ActiveSheet.Name = "SICOR" Then
       protPlan.IniciaRotina False
       
       lngLin = 4
       Do While lngLin <= Range("A1").Value
         If Range("A" & [lngLin]).Value = "X" And Rows(lngLin).Hidden = False Then
            Rows(lngLin).Hidden = True
         ElseIf Range("A" & [lngLin]).Value = "A" Then
            Rows(lngLin).Hidden = False
         End If
         lngLin = lngLin + 1
       Loop
    End If
    ' Inclusão do Catálogo SICOR - RNM - FIM 12/07/2022

    
    If ActiveSheet.Name = "FINANC_REL" Then
       Range("B12").Select
       Selection.AutoFilter
       Selection.AutoFilter Field:=1, Criteria1:=">0"
       Range("D3").Select
    End If
    
    ' Inclusão do Catálogo SICOR - RNM - INI 12/07/2022
    If ActiveSheet.Name = "SICOR" Then
       protPlan.IniciaRotina False
         
       lngLin = 4
       Do While lngLin <= Range("A1").Value
          If Range("A" & [lngLin]).Value = "X" And Rows(lngLin).Hidden = False Then
             Rows(lngLin).Hidden = True
          ElseIf Range("A" & [lngLin]).Value = "A" Then
             Rows(lngLin).Hidden = False
          End If
          lngLin = lngLin + 1
        Loop
    End If
    ' Inclusão do Catálogo SICOR - RNM - FIM 12/07/2022
    
    
Fim:
    flagBusca = 0       ' VERIFICAR RNM 10012017
    If intFlag <> 1 Then protPlan.FinalizaRotina
    Set protPlan = Nothing
End Sub

Sub AtualizaTelas()
    Application.ScreenUpdating = False
    Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao
    Application.ScreenUpdating = False
    xl01Cliente.Activate
    AtualizaTela 1
    protPlan.ProtegePlanilha
    xl02Aval.Activate
    AtualizaTela 1
    protPlan.ProtegePlanilha
    Application.ScreenUpdating = False
    xl03Prop.Activate
    AtualizaTela 1
    protPlan.ProtegePlanilha
    Application.ScreenUpdating = False
    xl04Crono.Activate
    AtualizaTela 1
    protPlan.ProtegePlanilha
    Application.ScreenUpdating = False
    xl05AtivAgri.Activate
    AtualizaTela 1
    protPlan.ProtegePlanilha
    Application.ScreenUpdating = False
    xl06AtivPec.Activate
    AtualizaTela 1
    protPlan.ProtegePlanilha
    Application.ScreenUpdating = False
    xl07OutAtv.Activate
    AtualizaTela 1
    Application.ScreenUpdating = False
    xl09CalcFinanc.Activate
    AtualizaTela 1
' RTC 1207004
'    Application.ScreenUpdating = False
'    xl14Geodesica.Activate   'RNM GSOL00969220 ini Coordenada Geodésicas 'Sprint 11
'    AtualizaTela 1
    xlSicor.Activate    'RNM ATUALIZA SICOR
    AtualizaTela 1
       
    'xl00Menu.Activate
    flagTela = 0
    Application.ScreenUpdating = False
    calcularAmortizacao 1
    calcularAmortizacao_2 1  'RTC 31115 - PLANO SAFRA 2016/2017 INI
    protPlan.ProtegePlanilha
   ' Application.ScreenUpdating = True
    
    protPlan.FinalizaRotina  ' RTC 1207004
    Set protPlan = Nothing
End Sub


Sub calcularAmortizacao(Optional intFlagA As Integer)
    Dim protPlan As clsProtecao
    Dim strResultado As String
    Dim carenciaOperacao As Integer
    Dim prazoOperacao As Integer
    Dim mesesOperacao As Integer
    Dim tipoParcelaIgual As Integer
    Dim mesInverso As Integer
    Dim periodicidadeOperacao As Integer
    Dim valorInical As Currency
    Dim valorCorrecaoMonetaria As Currency
    Dim valorJuros As Currency
    Dim valorParcelaPrincipal As Currency
    Dim valorParcelaPrincipalAcumulada As Currency
    Dim valorParcelaCorrecaoMonetaria As Currency
    Dim valorParcelaJuros As Currency
    Dim valorParcela As Currency
    Dim valorTotalOperacao As Currency
    Dim valorPrestacaoAcumulada As Currency
    Dim valorEncargosAcumulado As Currency
    Dim taxaRebate As Currency
    Dim taxaJuros As Currency
    Dim taxaCorrecaoMonetaria As Currency
    Dim saldoDevedor As Currency
    Dim saldoPrincipal As Currency
    Dim saldoEncargos As Currency
    Dim saldoJuros As Currency
    Dim saldoCorrecaoMonetaria As Currency
    Dim percentualCalculoParcela As Double
    Dim percentualCalculoEncargos As Double
    Dim percentualEncargos As Double
    Dim dataInicialOperacao As Date
    Dim dataOperacao As Date
    Dim dataFinalOperacao As Date
    
    Dim xPerc As Double
    
    Dim mesCarencia As Boolean
    Dim mesParcela As Boolean
    
    Dim contador As Integer
    Dim contadorParcela As Integer
    Dim linhaResultado As Long
    Dim colunaResultado As Long
    
    Dim anoOperacao As Integer
    Dim anoInicialOperacao As Integer
    Dim anoFinalOperacao As Integer
    Dim valorSaldoDevedorTotalAnual() As Currency
    Dim valorSaldoPrincipalAnual() As Currency
    Dim valorSaldoEncargosAnual() As Currency
    Dim valorParcelaPrincipalAnual() As Currency
    Dim valorParcelaAnual() As Currency
    Dim valorCapacidadePagamentoAnual() As Currency
    Dim percentualCalculoParcelaDif() As Double
    Dim valorDesembolsoAnual() As Currency
    Dim valorEncargosAnual() As Currency
    Dim valorParcelacomEncargosAnual() As Currency
    Dim valorParcelaAnualInformada() As Currency
    Dim quantidadeParcelasAnuais() As Integer
    Dim quantidadeParcelas As Integer
    
    'Sprint 11 04/2017 - Forçar a retornar para aba que chamou
    Dim xlPlan As String
    xlPlan = ActiveSheet.Name
    xl09CalcFinanc.Activate
    'Sprint 11 04/2017
    
    Set protPlan = New clsProtecao
    protPlan.IniciaRotina False
    
    '-parâmetros de calculo
    valorTotalOperacao = xl09CalcFinanc.Range("D12").Value
    prazoOperacao = xl09CalcFinanc.Range("D13").Value
    carenciaOperacao = xl09CalcFinanc.Range("D14").Value
    periodicidadeOperacao = xl09CalcFinanc.Range("X16").Value '1-mensal / 3-trimestral / 6-semestral / 12-anual
    taxaJuros = xl09CalcFinanc.Range("D15").Value / 100
    tipoParcelaIgual = xl09CalcFinanc.Range("X17").Value '0-Parcelas diferentes / 1-Parcelas iguais
    dataInicialOperacao = CDate(xl09CalcFinanc.Range("D18").Value)
    taxaCorrecaoMonetaria = 0#
    taxaRebate = 0
    
    '-
    dataFinalOperacao = DateAdd("m", prazoOperacao, dataInicialOperacao)
    dataOperacao = dataInicialOperacao
    anoOperacao = 0
    saldoCorrecaoMonetaria = 0: saldoJuros = 0: saldoEncargos = 0
    valorParcelaCorrecaoMonetaria = 0: valorParcelaJuros = 0: valorParcelaPrincipal = 0
    mesInverso = prazoOperacao
    anoFinalOperacao = Int(prazoOperacao / 12) + IIf((prazoOperacao Mod 12) > 0, 1, 0)
    valorPrestacaoAcumulada = 0
    valorEncargosAcumulado = 0

    '-Zera a memória de cálculo
    protPlan.IniciaRotina False
    'xl09CalcFinanc.Range("J12:J41").Value = 0  'Saldo devedor total é fórmula.
    'If tipoParcelaIgual <> 0 Then xl09CalcFinanc.Range("N12:N41").Value = 0
    'xl09CalcFinanc.Range("O12:P41").Value = 0 'GSOL00277827 'Saldo devedor total é fórmula.
    xl09CalcFinanc.Range("AA12:AZ600").ClearContents 'GSOL00277827
    xl09CalcFinanc.Range("BB12:BB41").Value = 0 'GSOL00277827
    '-

    'Redefine os acumuladores anual com limitante no fim da operação
    ReDim valorSaldoDevedorTotalAnual(anoFinalOperacao)
    ReDim valorSaldoPrincipalAnual(anoFinalOperacao)
    ReDim valorSaldoEncargosAnual(anoFinalOperacao)
    ReDim valorParcelaPrincipalAnual(anoFinalOperacao)
    ReDim valorParcelaAnual(anoFinalOperacao)
    ReDim percentualCalculoParcelaDif(anoFinalOperacao)
    ReDim valorCapacidadePagamentoAnual(anoFinalOperacao)
    ReDim valorDesembolsoAnual(anoFinalOperacao)
    ReDim valorEncargosAnual(anoFinalOperacao)
    ReDim valorParcelacomEncargosAnual(anoFinalOperacao)
    ReDim valorParcelaAnualInformada(anoFinalOperacao)
    ReDim quantidadeParcelasAnuais(anoFinalOperacao)
    
    '-
    
    '-preenche array com valores de capacidade de pagamento
    'em produção, este parâmetro é passado pelo usuário
    For contador = 1 To anoFinalOperacao
        valorCapacidadePagamentoAnual(contador) = xl09CalcFinanc.Cells(contador + 11, "K").Value
        valorDesembolsoAnual(contador - 1) = xl09CalcFinanc.Cells(contador + 11, "Z").Value
        valorParcelaAnualInformada(contador) = xl09CalcFinanc.Cells(contador + 11, "N").Value
    Next contador
    '-
    
    valorInical = valorDesembolsoAnual(0)
    saldoDevedor = valorInical
    
'    '-preenche array com percentuais
'    'em produção, este parâmetro é passado pelo usuário para cálculo com base no percentual informado
'    For contador = 1 To anoFinalOperacao
'        percentualCalculoParcelaDif(contador) = xl09CalcFinanc.Cells(contador + 11, "M").Value
'    Next contador
'    '-
   
    contador = 1
    linhaResultado = 12
    colunaResultado = 27
    quantidadeParcelas = 0
    Application.Calculation = xlCalculationManual
    For mesesOperacao = 1 To prazoOperacao
        'verifica se o mês está na carência
        If mesInverso >= ((dataFinalOperacao - dataInicialOperacao) / 30.5) + 1 - carenciaOperacao Then
           mesCarencia = True
           mesParcela = False
        Else
           mesCarencia = False
           'verifica se é mês de parcela
           If periodicidade = 1 Then
              mesParcela = True
           Else
              If (contador Mod periodicidadeOperacao) = 0 Then
                 mesParcela = True
              Else
                 mesParcela = False
              End If
           End If
        End If
        
        'atualiza contagem de parcelas para elaboração do cronograma de reembolso
        If mesParcela Then quantidadeParcelas = quantidadeParcelas + 1
        '-
        
        'Pega o saldo devedor de principal de acordo com o desembolso anual
        If contador = 1 Then
           saldoPrincipal = saldoPrincipal + valorDesembolsoAnual(anoOperacao)
        End If
        '-
        
        strAmortizacoesAtuais = RangeToString(xl09CalcFinanc.Range("N12:N" & anoFinalOperacao + 11)) '--- GSOL00904068
        If tipoParcelaIgual = 0 And strAmortizacoesIguais <> strAmortizacoesAtuais Then              '--- GSOL00904068
    
'           'Amortizações com base no percentual
'           If contador = 12 And mesParcela Then
'              If anoOperacao = anoFinalOperacao Then
'                 percentualCalculoParcela = 1 - xPerc
'              Else
'                 percentualCalculoParcela = WorksheetFunction.Round((percentualCalculoParcelaDif(anoOperacao + 1) / 100 * _
'                                            valorCapacidadePagamentoAnual(anoOperacao + 1)) / _
'                                            valorInical, 4)
'                 xPerc = xPerc + percentualCalculoParcela
'              End If
'           Else
'              percentualCalculoParcela = 0
'           End If
'           '-
           'Amortizações com base no valor informado
           If contador = 12 And mesParcela And saldoPrincipal > 0 Then
              percentualCalculoParcela = valorParcelaAnualInformada(anoOperacao + 1) / saldoPrincipal
              percentualEncargos = percentualEncargos + valorParcelaAnualInformada(anoOperacao + 1) / valorTotalOperacao
              percentualCalculoEncargos = percentualEncargos
           Else
              percentualCalculoParcela = 0
              percentualCalculoEncargos = 0
           End If
           '-
        Else
           percentualCalculoParcela = IIf(mesParcela, (mesInverso - 1) / periodicidadeOperacao + 1, 0)
           If percentualCalculoParcela > 0 Then percentualCalculoParcela = 100 / percentualCalculoParcela / 100
           percentualCalculoEncargos = percentualCalculoParcela
        End If
        
        
        'Aplica as fórmulas de cálculo
        valorCorrecaoMonetaria = (saldoDevedor * (((taxaCorrecaoMonetaria + 1) ^ (1 / 12)) - 1)) * 1 - taxaRebate
        valorJuros = (((taxaJuros + 1) ^ (1 / 12)) - 1) * (1 - taxaRebate) * (saldoDevedor + valorCorrecaoMonetaria)
        valorParcelaPrincipal = saldoPrincipal * percentualCalculoParcela
        valorParcelaCorrecaoMonetaria = (saldoCorrecaoMonetaria + valorCorrecaoMonetaria) * percentualCalculoEncargos
        valorParcelaJuros = (saldoJuros + valorJuros) * percentualCalculoEncargos
        valorParcela = valorParcelaPrincipal + valorParcelaCorrecaoMonetaria + valorParcelaJuros
        saldoPrincipal = saldoPrincipal - valorParcelaPrincipal
        saldoCorrecaoMonetaria = saldoCorrecaoMonetaria + valorCorrecaoMonetaria - valorParcelaCorrecaoMonetaria
        saldoJuros = saldoJuros + valorJuros - valorParcelaJuros
        saldoEncargos = saldoJuros + saldoCorrecaoMonetaria
        saldoDevedor = saldoPrincipal + saldoEncargos
        dataOperacao = DateAdd("m", 1, dataOperacao)
        '-
        
        valorParcelaPrincipalAcumulada = valorParcelaPrincipalAcumulada + valorParcelaPrincipal
        valorEncargosAcumulado = valorEncargosAcumulado + valorParcelaCorrecaoMonetaria + valorParcelaJuros
        
        mesInverso = mesInverso - 1
        If contador < 12 Then
           contador = contador + 1
        Else
           'Atualiza acumuladores anuais
           anoOperacao = anoOperacao + 1
           valorSaldoDevedorTotalAnual(anoOperacao) = saldoDevedor
           valorSaldoPrincipalAnual(anoOperacao) = saldoPrincipal
           valorEncargosAnual(anoOperacao) = WorksheetFunction.Round(valorEncargosAcumulado, 2)
           
           '-Fecha o valor da parcela principal na última parcela
           If mesesOperacao = prazoOperacao Then
              For contadorParcela = LBound(valorParcelaPrincipalAnual) To UBound(valorParcelaPrincipalAnual)
                  valorPrestacaoAcumulada = valorPrestacaoAcumulada + valorParcelaPrincipalAnual(contadorParcela)
              Next contadorParcela
              valorParcelaPrincipalAnual(anoOperacao) = valorTotalOperacao - valorPrestacaoAcumulada
           Else
              valorParcelaPrincipalAnual(anoOperacao) = WorksheetFunction.Round(valorParcelaPrincipalAcumulada, 2)
           End If
           '--
           valorParcelacomEncargosAnual(anoOperacao) = valorParcelaPrincipalAnual(anoOperacao) + valorEncargosAnual(anoOperacao)
           quantidadeParcelasAnuais(anoOperacao) = quantidadeParcelas
                       
           '-reinicia contadores
           valorParcelaPrincipalAcumulada = 0
           valorEncargosAcumulado = 0
           quantidadeParcelas = 0
           contador = 1
           '--
           '-
        End If
        
        'Monta a memória de cálculo
        Cells(linhaResultado, colunaResultado).Value = mesesOperacao
        Cells(linhaResultado, colunaResultado + 1).Value = valorCorrecaoMonetaria
        Cells(linhaResultado, colunaResultado + 2).Value = valorJuros
        Cells(linhaResultado, colunaResultado + 3).Value = saldoPrincipal
        Cells(linhaResultado, colunaResultado + 4).Value = saldoEncargos
        Cells(linhaResultado, colunaResultado + 5).Value = saldoCorrecaoMonetaria
        Cells(linhaResultado, colunaResultado + 6).Value = saldoJuros
        Cells(linhaResultado, colunaResultado + 7).Value = saldoDevedor
        Cells(linhaResultado, colunaResultado + 8).FormulaR1C1 = Format(dataOperacao, "mm/yyyy")
        Cells(linhaResultado, colunaResultado + 9).Value = valorParcelaPrincipal
        Cells(linhaResultado, colunaResultado + 10).Value = valorParcelaCorrecaoMonetaria
        Cells(linhaResultado, colunaResultado + 11).Value = valorParcelaJuros
        Cells(linhaResultado, colunaResultado + 12).Value = valorParcela
        '-
        
        linhaResultado = linhaResultado + 1
        
    Next mesesOperacao
    
    'Preenche tabela de cálculo
    For linhaResultado = 12 To anoFinalOperacao + 11
        'xl09CalcFinanc.Cells(linhaResultado, "J").Value = valorSaldoDevedorTotalAnual(linhaResultado - 11)
        xl09CalcFinanc.Cells(linhaResultado, "AN").Value = valorSaldoDevedorTotalAnual(linhaResultado - 11)
        xl09CalcFinanc.Cells(linhaResultado, "N").Value = valorParcelaPrincipalAnual(linhaResultado - 11)
        'xl09CalcFinanc.Cells(linhaResultado, "O").Value = valorSaldoPrincipalAnual(linhaResultado - 11)
        'xl09CalcFinanc.Cells(linhaResultado, "P").Value = valorEncargosAnual(linhaResultado - 11)
        xl09CalcFinanc.Cells(linhaResultado, "BB").Value = quantidadeParcelasAnuais(linhaResultado - 11)
        'Plan2.Cells(linhaResultado, "H").Value = WorksheetFunction.Round(valorParcelaPrincipalAnual(linhaResultado - 2) * 100 / Plan2.Cells(linhaResultado, "G").Value, 2)
    Next linhaResultado
    xl09CalcFinanc.Range("Y12").Value = 0
    Application.Calculation = xlCalculationAutomatic
    If intFlagA <> 1 Then protPlan.FinalizaRotina
    'Sprint 11 04/2017 - Forçar a retornar para aba que chamou
    Sheets(xlPlan).Activate
    Set protPlan = Nothing
End Sub
'RTC 31115 - Plano Safra 2016/2017
Sub calcularAmortizacao_2(Optional intFlagC As Integer)
    Dim protPlan As clsProtecao
    Dim strResultado As String
    Dim carenciaOperacao As Integer
    Dim prazoOperacao As Integer
    Dim mesesOperacao As Integer
    Dim tipoParcelaIgual As Integer
    Dim mesInverso As Integer
    Dim periodicidadeOperacao As Integer
    Dim valorInical As Currency
    Dim valorCorrecaoMonetaria As Currency
    Dim valorJuros As Currency
    Dim valorParcelaPrincipal As Currency
    Dim valorParcelaPrincipalAcumulada As Currency
    Dim valorParcelaCorrecaoMonetaria As Currency
    Dim valorParcelaJuros As Currency
    Dim valorParcela As Currency
    Dim valorTotalOperacao As Currency
    Dim valorPrestacaoAcumulada As Currency
    Dim valorEncargosAcumulado As Currency
    Dim taxaRebate As Currency
    Dim taxaJuros As Currency
    Dim taxaCorrecaoMonetaria As Currency
    Dim saldoDevedor As Currency
    Dim saldoPrincipal As Currency
    Dim saldoEncargos As Currency
    Dim saldoJuros As Currency
    Dim saldoCorrecaoMonetaria As Currency
    Dim percentualCalculoParcela As Double
    Dim percentualCalculoEncargos As Double
    Dim percentualEncargos As Double
    Dim dataInicialOperacao As Date
    Dim dataOperacao As Date
    Dim dataFinalOperacao As Date
    
    Dim xPerc As Double
    
    Dim mesCarencia As Boolean
    Dim mesParcela As Boolean
    
    Dim contador As Integer
    Dim contadorParcela As Integer
    Dim linhaResultado As Long
    Dim colunaResultado As Long
    
    Dim anoOperacao As Integer
    Dim anoInicialOperacao As Integer
    Dim anoFinalOperacao As Integer
    Dim valorSaldoDevedorTotalAnual() As Currency
    Dim valorSaldoPrincipalAnual() As Currency
    Dim valorSaldoEncargosAnual() As Currency
    Dim valorParcelaPrincipalAnual() As Currency
    Dim valorParcelaAnual() As Currency
    Dim valorCapacidadePagamentoAnual() As Currency
    Dim percentualCalculoParcelaDif() As Double
    Dim valorDesembolsoAnual() As Currency
    Dim valorEncargosAnual() As Currency
    Dim valorParcelacomEncargosAnual() As Currency
    Dim valorParcelaAnualInformada() As Currency
    Dim quantidadeParcelasAnuais() As Integer
    Dim quantidadeParcelas As Integer
    Set protPlan = New clsProtecao
    
    'Sprint 11 04/2017 - Forçar a retornar para aba que chamou
    Dim xlPlan As String
    xlPlan = ActiveSheet.Name
    xl09CalcFinanc.Activate
    
    protPlan.IniciaRotina False
    
    '-parâmetros de calculo
    valorTotalOperacao = xl09CalcFinanc.Range("DD12").Value
    prazoOperacao = xl09CalcFinanc.Range("DD13").Value
    carenciaOperacao = xl09CalcFinanc.Range("DD14").Value
    periodicidadeOperacao = xl09CalcFinanc.Range("DX16").Value '1-mensal / 3-trimestral / 6-semestral / 12-anual
    taxaJuros = xl09CalcFinanc.Range("DD15").Value / 100
    tipoParcelaIgual = xl09CalcFinanc.Range("DX17").Value '0-Parcelas diferentes / 1-Parcelas iguais
    dataInicialOperacao = CDate(xl09CalcFinanc.Range("DD18").Value)
    taxaCorrecaoMonetaria = 0#
    taxaRebate = 0
    
    '-
    dataFinalOperacao = DateAdd("m", prazoOperacao, dataInicialOperacao)
    dataOperacao = dataInicialOperacao
    anoOperacao = 0
    saldoCorrecaoMonetaria = 0: saldoJuros = 0: saldoEncargos = 0
    valorParcelaCorrecaoMonetaria = 0: valorParcelaJuros = 0: valorParcelaPrincipal = 0
    mesInverso = prazoOperacao
    anoFinalOperacao = Int(prazoOperacao / 12) + IIf((prazoOperacao Mod 12) > 0, 1, 0)
    valorPrestacaoAcumulada = 0
    valorEncargosAcumulado = 0

    
    '-Zera a memória de cálculo
    xl09CalcFinanc.Activate
    protPlan.IniciaRotina False
    'xl09CalcFinanc.Range("DJ12:DJ35").Value = 0 'Saldo devedor total é fórmula.
    If tipoParcelaIgual <> 0 Then xl09CalcFinanc.Range("DN12:DN41").Value = 0
    'xl09CalcFinanc.Range("DO12:DP41").Value = 0
    xl09CalcFinanc.Range("EA12:EZ400").ClearContents
    xl09CalcFinanc.Range("FB12:FB41").Value = 0
    '-
    'Redefine os acumuladores anual com limitante no fim da operação
    ReDim valorSaldoDevedorTotalAnual(anoFinalOperacao)
    ReDim valorSaldoPrincipalAnual(anoFinalOperacao)
    ReDim valorSaldoEncargosAnual(anoFinalOperacao)
    ReDim valorParcelaPrincipalAnual(anoFinalOperacao)
    ReDim valorParcelaAnual(anoFinalOperacao)
    ReDim percentualCalculoParcelaDif(anoFinalOperacao)
    ReDim valorCapacidadePagamentoAnual(anoFinalOperacao)
    ReDim valorDesembolsoAnual(anoFinalOperacao)
    ReDim valorEncargosAnual(anoFinalOperacao)
    ReDim valorParcelacomEncargosAnual(anoFinalOperacao)
    ReDim valorParcelaAnualInformada(anoFinalOperacao)
    ReDim quantidadeParcelasAnuais(anoFinalOperacao)
    
    '-
    
    '-preenche array com valores de capacidade de pagamento
    'em produção, este parâmetro é passado pelo usuário
    For contador = 1 To anoFinalOperacao
        valorCapacidadePagamentoAnual(contador) = xl09CalcFinanc.Cells(contador + 11, "DK").Value
        valorDesembolsoAnual(contador - 1) = xl09CalcFinanc.Cells(contador + 11, "DZ").Value
        valorParcelaAnualInformada(contador) = xl09CalcFinanc.Cells(contador + 11, "DN").Value
    Next contador
    '-
    
    valorInical = valorDesembolsoAnual(0)
    saldoDevedor = valorInical
    
'    '-preenche array com percentuais
'    'em produção, este parâmetro é passado pelo usuário para cálculo com base no percentual informado
'    For contador = 1 To anoFinalOperacao
'        percentualCalculoParcelaDif(contador) = xl09CalcFinanc.Cells(contador + 11, "M").Value
'    Next contador
'    '-
   
    contador = 1
    linhaResultado = 12
    colunaResultado = 131
    quantidadeParcelas = 0
    Application.Calculation = xlCalculationManual
    For mesesOperacao = 1 To prazoOperacao
        'verifica se o mês está na carência
        If mesInverso >= ((dataFinalOperacao - dataInicialOperacao) / 30.5) + 1 - carenciaOperacao Then
           mesCarencia = True
           mesParcela = False
        Else
           mesCarencia = False
           'verifica se é mês de parcela
           If periodicidade = 1 Then
              mesParcela = True
           Else
              If (contador Mod periodicidadeOperacao) = 0 Then
                 mesParcela = True
              Else
                 mesParcela = False
              End If
           End If
        End If
        
        'atualiza contagem de parcelas para elaboração do cronograma de reembolso
        If mesParcela Then quantidadeParcelas = quantidadeParcelas + 1
        '-
        
        'Pega o saldo devedor de principal de acordo com o desembolso anual
        If contador = 1 Then
           saldoPrincipal = saldoPrincipal + valorDesembolsoAnual(anoOperacao)
        End If
        '-
        
        If tipoParcelaIgual = 0 Then
'           'Amortizações com base no percentual
'           If contador = 12 And mesParcela Then
'              If anoOperacao = anoFinalOperacao Then
'                 percentualCalculoParcela = 1 - xPerc
'              Else
'                 percentualCalculoParcela = WorksheetFunction.Round((percentualCalculoParcelaDif(anoOperacao + 1) / 100 * _
'                                            valorCapacidadePagamentoAnual(anoOperacao + 1)) / _
'                                            valorInical, 4)
'                 xPerc = xPerc + percentualCalculoParcela
'              End If
'           Else
'              percentualCalculoParcela = 0
'           End If
'           '-
           'Amortizações com base no valor informado
           If contador = 12 And mesParcela And saldoPrincipal > 0 Then
              percentualCalculoParcela = valorParcelaAnualInformada(anoOperacao + 1) / saldoPrincipal
              percentualEncargos = percentualEncargos + valorParcelaAnualInformada(anoOperacao + 1) / valorTotalOperacao
              percentualCalculoEncargos = percentualEncargos
           Else
              percentualCalculoParcela = 0
              percentualCalculoEncargos = 0
           End If
           '-
        Else
           percentualCalculoParcela = IIf(mesParcela, (mesInverso - 1) / periodicidadeOperacao + 1, 0)
           If percentualCalculoParcela > 0 Then percentualCalculoParcela = 100 / percentualCalculoParcela / 100
           percentualCalculoEncargos = percentualCalculoParcela
        End If
        
        
        'Aplica as fórmulas de cálculo
        valorCorrecaoMonetaria = (saldoDevedor * (((taxaCorrecaoMonetaria + 1) ^ (1 / 12)) - 1)) * 1 - taxaRebate
        valorJuros = (((taxaJuros + 1) ^ (1 / 12)) - 1) * (1 - taxaRebate) * (saldoDevedor + valorCorrecaoMonetaria)
        valorParcelaPrincipal = saldoPrincipal * percentualCalculoParcela
        valorParcelaCorrecaoMonetaria = (saldoCorrecaoMonetaria + valorCorrecaoMonetaria) * percentualCalculoEncargos
        valorParcelaJuros = (saldoJuros + valorJuros) * percentualCalculoEncargos
        valorParcela = valorParcelaPrincipal + valorParcelaCorrecaoMonetaria + valorParcelaJuros
        saldoPrincipal = saldoPrincipal - valorParcelaPrincipal
        saldoCorrecaoMonetaria = saldoCorrecaoMonetaria + valorCorrecaoMonetaria - valorParcelaCorrecaoMonetaria
        saldoJuros = saldoJuros + valorJuros - valorParcelaJuros
        saldoEncargos = saldoJuros + saldoCorrecaoMonetaria
        saldoDevedor = saldoPrincipal + saldoEncargos
        dataOperacao = DateAdd("m", 1, dataOperacao)
        '-
        
        valorParcelaPrincipalAcumulada = valorParcelaPrincipalAcumulada + valorParcelaPrincipal
        valorEncargosAcumulado = valorEncargosAcumulado + valorParcelaCorrecaoMonetaria + valorParcelaJuros
        
        mesInverso = mesInverso - 1
        If contador < 12 Then
           contador = contador + 1
        Else
           'Atualiza acumuladores anuais
           anoOperacao = anoOperacao + 1
           valorSaldoDevedorTotalAnual(anoOperacao) = saldoDevedor
           valorSaldoPrincipalAnual(anoOperacao) = saldoPrincipal
           valorEncargosAnual(anoOperacao) = WorksheetFunction.Round(valorEncargosAcumulado, 2)
           
           '-Fecha o valor da parcela principal na última parcela
           If mesesOperacao = prazoOperacao Then
              For contadorParcela = LBound(valorParcelaPrincipalAnual) To UBound(valorParcelaPrincipalAnual)
                  valorPrestacaoAcumulada = valorPrestacaoAcumulada + valorParcelaPrincipalAnual(contadorParcela)
              Next contadorParcela
              valorParcelaPrincipalAnual(anoOperacao) = valorTotalOperacao - valorPrestacaoAcumulada
           Else
              valorParcelaPrincipalAnual(anoOperacao) = WorksheetFunction.Round(valorParcelaPrincipalAcumulada, 2)
           End If
           '--
           valorParcelacomEncargosAnual(anoOperacao) = valorParcelaPrincipalAnual(anoOperacao) + valorEncargosAnual(anoOperacao)
           quantidadeParcelasAnuais(anoOperacao) = quantidadeParcelas
                       
           '-reinicia contadores
           valorParcelaPrincipalAcumulada = 0
           valorEncargosAcumulado = 0
           quantidadeParcelas = 0
           contador = 1
           '--
           '-
        End If
        
        'Monta a memória de cálculo
        Cells(linhaResultado, colunaResultado).Value = mesesOperacao
        Cells(linhaResultado, colunaResultado + 1).Value = valorCorrecaoMonetaria
        Cells(linhaResultado, colunaResultado + 2).Value = valorJuros
        Cells(linhaResultado, colunaResultado + 3).Value = saldoPrincipal
        Cells(linhaResultado, colunaResultado + 4).Value = saldoEncargos
        Cells(linhaResultado, colunaResultado + 5).Value = saldoCorrecaoMonetaria
        Cells(linhaResultado, colunaResultado + 6).Value = saldoJuros
        Cells(linhaResultado, colunaResultado + 7).Value = saldoDevedor
        Cells(linhaResultado, colunaResultado + 8).FormulaR1C1 = Format(dataOperacao, "mm/yyyy")
        Cells(linhaResultado, colunaResultado + 9).Value = valorParcelaPrincipal
        Cells(linhaResultado, colunaResultado + 10).Value = valorParcelaCorrecaoMonetaria
        Cells(linhaResultado, colunaResultado + 11).Value = valorParcelaJuros
        Cells(linhaResultado, colunaResultado + 12).Value = valorParcela
        '-
        
        linhaResultado = linhaResultado + 1
        
    Next mesesOperacao
    
    'Preenche tabela de cálculo
    For linhaResultado = 12 To anoFinalOperacao + 11
        xl09CalcFinanc.Cells(linhaResultado, "EN").Value = valorSaldoDevedorTotalAnual(linhaResultado - 11)
        xl09CalcFinanc.Cells(linhaResultado, "DN").Value = valorParcelaPrincipalAnual(linhaResultado - 11)
        'xl09CalcFinanc.Cells(linhaResultado, "DO").Value = valorSaldoPrincipalAnual(linhaResultado - 11)
        'xl09CalcFinanc.Cells(linhaResultado, "DP").Value = valorEncargosAnual(linhaResultado - 11)
        xl09CalcFinanc.Cells(linhaResultado, "FB").Value = quantidadeParcelasAnuais(linhaResultado - 11)
        'Plan2.Cells(linhaResultado, "DH").Value = WorksheetFunction.Round(valorParcelaPrincipalAnual(linhaResultado - 2) * 100 / Plan2.Cells(linhaResultado, "G").Value, 2)
    Next linhaResultado
    If intFlagC <> 1 Then protPlan.FinalizaRotina
    Application.Calculation = xlCalculationAutomatic
    'Sprint 11 04/2017 - Forçar a retornar para aba que chamou
    Sheets(xlPlan).Activate
    Set protPlan = Nothing
End Sub


Sub AtualizaData()
' Macro gravada em 14/04/2011
    Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao

    'Sheets("Inicio").Select
    'Range("C30").Select
    'ProtPlan.DesprotegePlanilha
    'ActiveCell.FormulaR1C1 = "=TEXT(TODAY(),""dd/mm/aaaa"")"
    'Selection.Copy
    'Selection.PasteSpecial Paste:=xlPasteValues, Operation:=xlNone, SkipBlanks _
    '    :=False, Transpose:=False
'    Range("C29").Select
'    ActiveCell.FormulaR1C1 = "=CONCATENATE(""2.0.13.059 -  "",R[1]C)"
'    Selection.Copy
'    Selection.PasteSpecial Paste:=xlPasteValues, Operation:=xlNone, SkipBlanks _
'        :=False, Transpose:=False
'    Sheets("Menu").Select
'    ActiveSheet.Visible = xlSheetVeryHidden
'    Range("C25").Select
'    ActiveCell.FormulaR1C1 = "=TEXT(TODAY(),""dd/mm/aaaa"")"
'    Selection.Copy
'    Selection.PasteSpecial Paste:=xlPasteValues, Operation:=xlNone, SkipBlanks _
'        :=False, Transpose:=False
'    Range("C24").Select
'    ActiveCell.FormulaR1C1 = "=CONCATENATE(""2.0.13.057 - "",R[1]C)"
'    Selection.Copy
'    Selection.PasteSpecial Paste:=xlPasteValues, Operation:=xlNone, SkipBlanks _
'        :=False, Transpose:=False
    
    Set protPlan = Nothing
End Sub

'Sprint 11 04/2017 - Comentar tudo relativo a tela de coordenadas anterior ( formulário ) INI
'Sub AtualizaCoordenadas()
'   Dim L_Inv, L_seq, L_SeqInv As Byte
'   Dim xlPlanAtual As String
'   Dim protPlan As clsProtecao
'   Set protPlan = New clsProtecao
'
'   flagBusca = 1
'
'   xlPlanAtual = ActiveSheet.Name
'   Application.ScreenUpdating = False
'   bd10Geodesica.Activate
'   bd10Geodesica.Calculate
'   xl00Visao.Calculate
'
'   protPlan.DesprotegePlanilha
'
'   L_seq = 1
'   L_SeqInv = 0
'   bd10Geodesica.Range("A2:E97").ClearContents
'
'
'   'Planilha de Investimentos ( RURAL, INDUSTRIAL E C UNIFICADO )
'   For L_Inv = 11 To 46
'      L_SeqInv = L_SeqInv + 1
'      If xl00Visao.Range("GZ" & [L_Inv]).Value = -1 Then
'          L_seq = L_seq + 1
'          bd10Geodesica.Range("A" & [L_seq]).Value = L_SeqInv                                     'AD NRO DA INVERSAO  AD  PARA A
'          bd10Geodesica.Range("B" & [L_seq]).Value = xl00Visao.Range("GP" & [L_Inv]).Value        'NOME DA INVERSAO AJ PARA B
'          bd10Geodesica.Range("C" & [L_seq]).Value = xl00Visao.Range("GR" & [L_Inv]).Value         'CÓDIGO Do EMPREENDIMENTO
'          bd10Geodesica.Range("D" & [L_seq]).FormulaLocal = "=SE(ÉERROS(PROCV(Cronograma!Y" & [L_Inv] + 191 & ";SQ_ImovVinc;15;0));"""";PROCV(Cronograma!Y" & [L_Inv] + 191 & ";SQ_ImovVinc;15;0))" ' Município para D
'          bd10Geodesica.Range("E" & [L_seq]).FormulaLocal = "=SE(ÉERROS(PROCV(Cronograma!Y" & [L_Inv] + 191 & ";SQ_ImovVinc;8;0));"""";PROCV(Cronograma!Y" & [L_Inv] + 191 & ";SQ_ImovVinc;8;0))"  ' Área  G para E
'      End If
'   Next L_Inv
'
'   'Historico de Inversão para eventual alteração de inversão.
'   For L_Inv = 2 To 37
'       bd10Geodesica.Range("M" & [L_Inv]).Value = bd10Geodesica.Range("A" & [L_Inv]).Value
'       bd10Geodesica.Range("N" & [L_Inv]).Value = bd10Geodesica.Range("B" & [L_Inv]).Value
'       bd10Geodesica.Range("O" & [L_Inv]).Value = bd10Geodesica.Range("C" & [L_Inv]).Value
'   Next L_Inv
'
'   'calculate   INCLUSÃO
'   bd10Geodesica.Range("F1").Calculate
'   bd10Geodesica.Range("B99").Calculate
'
'   'Adequar o range das linhas de acordo com a quantidade de inversões
'   'Inv_Geodesica
'   ActiveWorkbook.Names.Add Name:="Inv_Geodesica_Hist", RefersToR1C1:= _
'                 "=Geodesica!R2C13:R" & bd10Geodesica.Range("F1").Value + 1 & "C14"
'
'   ActiveWorkbook.Names.Add Name:="Inv_Geodesica_Hist_NM", RefersToR1C1:= _
'                     "=Geodesica!R2C14:R" & bd10Geodesica.Range("F1").Value + 1 & "C14"
'   'Adequar o range das linhas de acordo com a quantidade de inversões
'   'Inv_Geodesica
'   ActiveWorkbook.Names.Add Name:="Inv_Geodesica", RefersToR1C1:= _
'                 "=Geodesica!R2C1:R" & bd10Geodesica.Range("F1").Value + 1 & "C5"
'
'
'   Call OrdenarListaGleba
'
'   Application.ScreenUpdating = False
'   'Ordenar
'   frmGeodesica.Ordenar_Geodesica "SQ_Geodesica", "Geodesica", "A100:M" & bd10Geodesica.Range("B99").Value + 100, "B100:B" & bd10Geodesica.Range("B99").Value + 100
'
''   bd10Geodesica.Calculate
''   For L_Inv = 101 To 65536
''     On Error Resume Next
''     If bd10Geodesica.Range("A" & [L_Inv]).Value <> "" Then
''        If bd10Geodesica.Range("A" & [L_Inv]).Value = "#N/D" Then
''           bd10Geodesica.Rows(L_Inv).Select
''           Selection.Delete Shift:=xlUp
''           L_Inv = L_Inv - 1
''        End If
''     Else
''        Exit For
''     End If
''   Next L_Inv
'
'   xl00Visao.Calculate
'   For L_Inv = 11 To 46
'      If xl00Visao.Range("GX" & [L_Inv]).Value = "-1" Then
'        Application.ScreenUpdating = False
'        LimparGlebaPontos xl00Visao.Range("GO" & [L_Inv]).Value, 0
'      End If
'   Next L_Inv
'
'   flagBusca = 0
'
'   Set protPlan = Nothing
'   Application.ScreenUpdating = False
'
'   Sheets(xlPlanAtual).Activate
'End Sub
'Sprint 11 04/2017 - Comentar tudo relativo a tela de coordenadas anterior ( formulário ) FIM

Function RangeToString(rng As Range) As String
    Dim listaDeValores As String
    Dim R As Range
    
    If rng Is Nothing Then
        RangeToString = ""
        Exit Function
    End If
    
    For Each R In rng
        listaDeValores = listaDeValores & R.Value & ","
    Next
    
    RangeToString = Left(listaDeValores, Len(listaDeValores) - 1)
End Function


Sub MascaraCPFCNPJ()
   
   Dim i As Integer
   
   For i = 7 To 9
     If xl02Aval.Range("H" & [i]).Value <> vbNullString And xl02Aval.Range("J" & [i]).Value <> vbNullString Then
        If xl02Aval.Range("H" & [i]).Value = "P.Física" Then
           xl02Aval.Range("J" & [i]).NumberFormat = "000000000-00"
        
        ' Retirei a mascara do CNPJ / ALFA NUMERICO - 06.03.2026
        ' JORIS BANE
        
           
        Else
           xl02Aval.Range("J" & [i]).NumberFormat = "000000000000-00"
        End If
     End If
   Next i
   
End Sub



' Inclusão do Catálogo SICOR - RNM - INI 02/08/2021
Sub InserirLinha()
      Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao

    protPlan.IniciaRotina False
    Dim lngLin As Long

    lngLin = ActiveCell.Row
    If ActiveCell.Row >= 7 And ActiveCell.Row <= Range("A1").Value Then
       If Range("A" & (lngLin + 1)).Value = "A" Then
          Range("C" & lngLin + 1).Select
       Else
          Rows(lngLin + 1).Hidden = False
          Range("C" & lngLin + 1).Select
       End If
    End If
        
    protPlan.FinalizaRotina
    Set protPlan = Nothing
End Sub
' Inclusão do Catálogo SICOR - RNM - FIM 02/08/2021

' Inclusão do Catálogo SICOR - RNM - INI 02/08/2021
Sub ExcluirLinha()
   Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao

   protPlan.IniciaRotina False
    Dim lngLin As Long

    lngLin = ActiveCell.Row
    If ActiveCell.Row >= 8 And ActiveCell.Row <= Range("A1").Value Then
       Range("C" & [lngLin] & ":J" & [lngLin]).ClearContents
       Range("A" & [lngLin]).Calculate              ' Inserir o código para pegar a célula calculada RNM 2021/08/16
      If Range("A" & (lngLin)).Value = "X" Then
         Rows(lngLin).Hidden = True
       End If
    End If
    
    Range("C" & [lngLin] - 1).Select
    protPlan.FinalizaRotina
    Set protPlan = Nothing
End Sub
' Inclusão do Catálogo SICOR - RNM - FIM 02/08/2021


Sub forrageiro_tela()
'
' forrageiro_tela Macro
'

'
    Range("D48:D49").Select
    ActiveSheet.Unprotect
    With Selection.Interior
        .Pattern = xlSolid
        .PatternColorIndex = xlAutomatic
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.249977111117893
        .PatternTintAndShade = 0
    End With
    Range("D51:D52").Select
    With Selection.Interior
        .PatternColorIndex = xlAutomatic
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.249977111117893
        .PatternTintAndShade = 0
    End With
    Range("E52:F52").Select
    With Selection.Interior
        .Pattern = xlSolid
        .PatternColorIndex = xlAutomatic
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.249977111117893
        .PatternTintAndShade = 0
    End With
    Selection.NumberFormat = "0.0"
    Selection.NumberFormat = "0.00"
    Range("D51:D52").Select
    With Selection.Font
        .ColorIndex = xlAutomatic
        .TintAndShade = 0
    End With
    Range("F60").Select
    Selection.Copy
    Range("D60:E60").Select
    Selection.PasteSpecial Paste:=xlPasteFormats, Operation:=xlNone, _
        SkipBlanks:=False, Transpose:=False
    Application.CutCopyMode = False
    Range("D60").Select
    With Selection.Font
        .ColorIndex = xlAutomatic
        .TintAndShade = 0
    End With
    Range("D2:F2").Select
    
   '' joris Range("E54,E58").Select
    Range("E58").Activate
    Selection.NumberFormat = "0.0"
    Selection.Style = "Percent"
    With Selection.Interior
        .PatternColorIndex = xlAutomatic
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.249977111117893
        .PatternTintAndShade = 0
    End With
    Range("F57").Select
    Selection.Copy
    Range("F58").Select
    Selection.PasteSpecial Paste:=xlPasteFormats, Operation:=xlNone, _
        SkipBlanks:=False, Transpose:=False
    Application.CutCopyMode = False
    
    Range("d2").Select
    With Selection.Font
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = 0
    End With
    
       
End Sub
    
Sub AjustaRelatorio()

    Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao
   ' protPlan.IniciaRotina False
    protPlan.DesprotegePlanilha
'
    'Application.ScreenUpdating = False
    
'---- Ajuste catálogo 5.08

    Range("B9:L9").Select
    Selection.Borders(xlDiagonalDown).LineStyle = xlNone
    Selection.Borders(xlDiagonalUp).LineStyle = xlNone
    With Selection.Borders(xlEdgeLeft)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With Selection.Borders(xlEdgeTop)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With Selection.Borders(xlEdgeBottom)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With Selection.Borders(xlEdgeRight)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With Selection.Borders(xlInsideVertical)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    Selection.Borders(xlInsideHorizontal).LineStyle = xlNone
    With Selection
        .HorizontalAlignment = xlGeneral
        .VerticalAlignment = xlBottom
        .WrapText = True
        .Orientation = 0
        .AddIndent = False
        .IndentLevel = 0
        .ShrinkToFit = False
        .ReadingOrder = xlContext
        .MergeCells = False
    End With
    With Selection
        .HorizontalAlignment = xlGeneral
        .VerticalAlignment = xlCenter
        .WrapText = True
        .Orientation = 0
        .AddIndent = False
        .IndentLevel = 0
        .ShrinkToFit = False
        .ReadingOrder = xlContext
        .MergeCells = False
    End With
    With Selection
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .WrapText = True
        .Orientation = 0
        .AddIndent = False
        .IndentLevel = 0
        .ShrinkToFit = False
        .ReadingOrder = xlContext
        .MergeCells = False
    End With
    Selection.Font.Bold = True
    Range("B10:L10").Select
    Selection.Borders(xlDiagonalDown).LineStyle = xlNone
    Selection.Borders(xlDiagonalUp).LineStyle = xlNone
    With Selection.Borders(xlEdgeLeft)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlHairline
    End With
    With Selection.Borders(xlEdgeTop)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With Selection.Borders(xlEdgeBottom)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlHairline
    End With
    With Selection.Borders(xlEdgeRight)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With Selection.Borders(xlInsideVertical)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlHairline
    End With
    Selection.Borders(xlInsideHorizontal).LineStyle = xlNone
    Range("B12:L48").Select
    Selection.Borders(xlDiagonalDown).LineStyle = xlNone
    Selection.Borders(xlDiagonalUp).LineStyle = xlNone
    With Selection.Borders(xlEdgeLeft)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlHairline
    End With
    With Selection.Borders(xlEdgeTop)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlHairline
    End With
    With Selection.Borders(xlEdgeBottom)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlHairline
    End With
    With Selection.Borders(xlEdgeRight)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With Selection.Borders(xlInsideVertical)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlHairline
    End With
    With Selection.Borders(xlInsideHorizontal)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlHairline
    End With
    
    Range("K10:L48").Select
    Selection.NumberFormat = "0"
    
'--- fim Catálogo 5.08
    
'    protPlan.ProtegePlanilha
'    protPlan.FinalizaRotina
    Set protPlan = Nothing


End Sub

  


