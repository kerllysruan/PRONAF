Attribute VB_Name = "mdlIntegra"
Sub Exibe_SICOR()
    xlSicor.Visible = xlSheetVisible
    xlSicor.Activate
    
End Sub

'SICOR  12/07/2022 RNM INI
Function ExportaProjetoSICOR() As Integer
Dim ls_descricao, ls_desc_item As String
Dim ldb_perc_enr_ren As Double
Dim li_tot_inversao As Integer
On Error GoTo erroExportaProjetosicor
'Limpar região de exportação
xl00Dados.Range("F2002:N3000").ClearContents
li_contador = 4
li_descricao = 4 'Somar sempre mais 24 linhas que é o total por inversão q são no máximo 20 linhas
li_ini_exp = 2002
li_it_inv = 4
li_tot_inv = 1 'Contar total de inversões para fixar em 36. Passou disso, saio do laço forçadamente. '03/08/2021
parte1:
 Do While li_contador <= 868
    If li_contador = li_descricao Then 'entrar laço para varrer todos os dados da inversão atual até as 20 linhas
       ls_descricao = xlSicor.Range("D" & [li_descricao]).Value             'Se coluna D não tiver nada, pular para proxima inversao
       ldb_perc_enr_ren = xlSicor.Range("E" & [li_descricao] + 1).Value   'Valor de Percentual de energia Renovável
       If ls_descricao = "" Then 'Não está preenchido.
          li_contador = li_contador + 24 'saltar para próxima Inversão caso a descrição da inversão atual, esteja em branco.
          li_descricao = li_contador
          li_ini_exp = li_ini_exp + 20
          GoTo parte1
       End If
    End If
    li_inv = li_contador + 3 '2 'Pular cabeçalho. Se for +2 Ele exporta também o cabeçalho, e sendo +3, ele elimina o cabeçalho.
    'Gravar na primeira linha os dados de discriminação e percentual
    'xl00Dados.Range("L" & [li_ini_exp]).Value = ls_descricao                         'Descriminação da Inversão
    'xl00Dados.Range("M" & [li_ini_exp]).Value = ldb_perc_enr_ren                     'Percentual de Energia Renovável
        
    For li_it_inv = li_inv To li_inv + 19  'pegar todos itens da inversão atual que tenham dados
        'Pegar dados dos itens e gravar na aba de exportação
        ls_desc_item = xlSicor.Range("A" & [li_it_inv]).Value
        If ls_desc_item = "" Then 'Não está preenchido.
           Exit For
        End If
        
'        'Verificar se tem dados preenchidos nas 4 colunas 03/08/2021 INICIO
        If ls_desc_item = "A" And xlSicor.Range("C" & [li_it_inv]).Value = "" And _
           xlSicor.Range("E" & [li_it_inv]).Value = "" And xlSicor.Range("G" & [li_it_inv]).Value = "" And _
           xlSicor.Range("I" & [li_it_inv]).Value = "" And xlSicor.Range("B" & [li_it_inv]).Value <> "1" Then
          ' Exit For
        End If
'        'Verificar se tem dados preenchidos nas 4 colunas 03/08/2021 FINAL
        
        'Gravar os itens da inversão atual para exportacao, caso tenham valores.
        If xlSicor.Range("C" & [li_it_inv]).Value <> "" And xlSicor.Range("E" & [li_it_inv]).Value <> "" And xlSicor.Range("G" & [li_it_inv]).Value <> "" And xlSicor.Range("I" & [li_it_inv]).Value <> "" Then
          ' xl00Dados.Range("E" & [li_ini_exp]).NumberFormat = "@"
          ' xl00Dados.Range("E" & [li_ini_exp]).Value = xlSicor.Range("X" & [li_it_inv]).Value 'Sequencial
           xl00Dados.Range("F" & [li_ini_exp]).Value = ls_descricao                         'Descrição da Inversão
           xl00Dados.Range("G" & [li_ini_exp]).NumberFormat = "@"
           xl00Dados.Range("G" & [li_ini_exp]).Value = xlSicor.Range("C" & [li_it_inv]).Value 'Código de Certificação Orgânica
           xl00Dados.Range("H" & [li_ini_exp]).NumberFormat = "@"
           xl00Dados.Range("H" & [li_ini_exp]).Value = xlSicor.Range("E" & [li_it_inv]).Value 'URL da Certificação Orgânica
           xl00Dados.Range("I" & [li_ini_exp]).NumberFormat = "@"
           xl00Dados.Range("I" & [li_ini_exp]).Value = xlSicor.Range("G" & [li_it_inv]).Value 'Código de Rastreabilidade
           xl00Dados.Range("J" & [li_ini_exp]).NumberFormat = "@"
           xl00Dados.Range("J" & [li_ini_exp]).Value = xlSicor.Range("I" & [li_it_inv]).Value 'URL da Certificação de Rastreabilidade
           xl00Dados.Range("K" & [li_ini_exp]).Value = ldb_perc_enr_ren                     'Percentual de Energia Renovável.
          ' xl00Dados.Range("N" & [li_ini_exp]).Value = xlSicor.Range("B" & [li_it_inv]).Value 'Sequencial
         Else
          '  xl00Dados.Range("N" & [li_ini_exp]).Value = xlSicor.Range("B" & [li_it_inv]).Value 'Sequencial
          '  xl00Dados.Range("E" & [li_ini_exp]).Value = xlSicor.Range("X" & [li_it_inv]).Value 'Sequencial 03/08/2021 22:16 MOSTRAR A SEQUENCIA MESMO SENDO BRANCO
         End If
         li_ini_exp = li_ini_exp + 1
    Next
    li_descricao = li_it_inv + 1
    'Se tiver cabeçalho (descricao da inversao) fazer laco + 2 até laco + 2 + 24 (total) que serão 20 linhas varridas e caso tenham valor "", pular linha
    '  Next
    li_contador = li_it_inv + 1
    li_tot_inv = li_tot_inv + 1
    If li_tot_inv >= 36 Then
       li_contador = 868 'Forçar sair do laço '03/08/2021
    End If
Loop
'SICOR  12/07/2022 RNM FIM

ExportaProjetoSICOR = 1
         Exit Function

erroExportaProjetosicor:
         ExportaProjetoSICOR = -1

End Function
Sub ExportaProjeto()
    Dim xlInvRural As String, strFiltro As String, xlArqExp As String, xlArqDados As String
    Dim flagArquivo As Boolean
    Dim xlArquivo, xlPlan
    Dim sb As clsProgressBar
    Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao
    Set sb = New clsProgressBar
    'Sprint 11 04/2017 - Permitir utilizar a área de transferência
    Boorel = True
    
    xl00Menu.Activate
    xlInvRural = ActiveWorkbook.Name
    flagArquivo = False
    strFiltro = "Arquivo de dados Planilha PRONAF A2 (*.PRONAF_A2),*.PRONAF_A2"
    Do While Not flagArquivo
       xlArquivo = Application.GetSaveAsFilename("", [strFiltro], , ":: Planilha PRONAF A2 - Informe o nome do arquivo de dados")
       If xlArquivo = False Then Exit Do
       If ExisteArquivo(xlArquivo) Then
          If MsgBox("Já existe um arquivo com este nome." & vbCrLf & _
                    "Deseja sobrescrever?", vbQuestion + vbYesNo) = vbYes Then
             flagArquivo = True
          End If
       Else
          flagArquivo = True
       End If
    Loop
    If Not flagArquivo Then
       Set sb = Nothing
       Set protPlan = Nothing
       Exit Sub
    End If
    protPlan.IniciaRotina False
    
    
    xlArqExp = Application.WorksheetFunction.Substitute(UCase(xlArquivo), ".PRONAF_A2", "_PRONAF_A2.XLS")
    xlArqExp = Application.WorksheetFunction.Proper(xlArqExp)
    xlArqDados = xlArquivo
    If ExisteArquivo(xlArqExp) Then Kill (xlArqExp)
    xl00Dados.Activate
    protPlan.DesprotegePlanilha
    Rows(12).ClearContents
    Rows("22:119").ClearContents
    Rows("122:219").ClearContents
    Rows("222:319").ClearContents
    Rows("322:419").ClearContents
    Rows("422:519").ClearContents
    Rows("522:619").ClearContents
    Rows("622:719").ClearContents
    Rows("722:819").ClearContents
    Range("HA2:HN" & Rows.Count).ClearContents
    
    ' RTC 1207004 Call CargaIniGeodesica
    'application.EnableCancelKey=xlDisabled
    sb.Show "Gerando arquivo de dados ", vbNullString, 1
    On Error GoTo erroExportaProjeto
'---- Cliente
    If ExportaProjetoCliente() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 10
'---- Avaliação
    If ExportaProjetoAvaliacao() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 20
'---- Proposta
    If ExportaProjetoProposta() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 30
'---- Cronograma e complementos
    If ExportaProjetoCronograma() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 40
' RTC 1207004
'---- Coordenadas Geodésicas GSOL00969220 - RNM INI
'    If ExportaProjetoCoordGeodesicas() = -1 Then GoTo erroExportaProjeto
'     sb.PercentComplete = 45                 'GSOL00969220 - RNM INI
'---- Atividade Agricola ----
    If ExportaProjetoAtivAgricola() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 50
'---- Atividade Pecuária ----
    If ExportaProjetoAtivPecuaria() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 60
'---- Outras Atividades
    If ExportaProjetoOutraAtiv() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 70
'---- Planilha Financiamento ----
    If ExportaProjetoBaseFin() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 90
'---- Planilha SICOR ----   '18/08/2021 INICIO
    If ExportaProjetoSICOR() = -1 Then GoTo erroExportaProjeto
    sb.PercentComplete = 95 '18/08/2021 FINAL
    If ExisteArquivo(xlArquivo) Then Kill (xlArquivo)
    
    Workbooks.Add
    'Verifica a versão do excel
    If Int(Left(Application.Version, 2)) >= 11 Then
        ActiveWorkbook.SaveAs Filename:=xlArqExp, FileFormat:=xlExcel8, Password:="senhasBN", WriteResPassword:="", ReadOnlyRecommended:=False, CreateBackup:=False
    Else
        ActiveWorkbook.SaveAs Filename:=xlArqExp, FileFormat:=xlNormal, Password:="senhasBN", WriteResPassword:="", ReadOnlyRecommended:=False, CreateBackup:=False
    End If
    xlArquivo = ActiveWorkbook.Name
    Application.DisplayAlerts = False
    ActiveSheet.Name = "BdPRONAF_C"
    For Each xlPlan In Sheets
        If xlPlan.Name <> "BdPRONAF_C" Then xlPlan.Delete
    Next
    Application.DisplayAlerts = True
    sb.Show "Gerando arquivo de dados ", vbNullString, 94
    Workbooks([xlInvRural]).Activate
    xl00Dados.Activate
    Range("A3").Value = xl00Menu.Range("B24").Value
    Range("A4").Value = CDate(SEAP.Range("D2").Value)
    sb.Show "Gerando arquivo de dados ", vbNullString, 96
    Cells.Select
    Selection.Copy
    Workbooks([xlArquivo]).Activate
    Sheets("BdPRONAF_C").Activate
    Range("A1").Select
    Selection.PasteSpecial

    
    Application.CutCopyMode = False
    ActiveWorkbook.Close SaveChanges:=True
    Name xlArqExp As xlArqDados
    
    
    Workbooks([xlInvRural]).Activate
    sb.Show "Gerando arquivo de dados ", vbNullString, 98
    xl00Dados.Activate
    protPlan.DesprotegePlanilha
    Rows(12).ClearContents
    Rows("22:119").ClearContents
    Rows("122:219").ClearContents
    Rows("222:319").ClearContents
    Rows("322:419").ClearContents
    Rows("422:519").ClearContents
    Rows("522:619").ClearContents
    Rows("622:719").ClearContents
    Rows("722:819").ClearContents
    Range("HA2:HN" & Rows.Count).ClearContents
    protPlan.ProtegePlanilha
    
    xl00Menu.Activate
    sb.PercentComplete = 100
    MsgBox "Arquivo Gerado" & vbCrLf & xlArqDados
    Set sb = Nothing
    Application.EnableCancelKey = xlInterrupt
    protPlan.FinalizaRotina
    Set protPlan = Nothing
    Exit Sub
     
erroExportaProjeto:
    MsgBox "Ocorreu um erro durante o processo" & vbCrLf & Err.Description
    Workbooks([xlInvRural]).Activate
    xl00Dados.Activate
    Rows(12).ClearContents
    Rows("22:119").ClearContents
    Rows("122:219").ClearContents
    Rows("222:319").ClearContents
    Rows("322:419").ClearContents
    Rows("422:519").ClearContents
    Rows("522:619").ClearContents
    Rows("622:719").ClearContents
    Rows("722:819").ClearContents
    Range("HA2:HN" & Rows.Count).ClearContents
    protPlan.ProtegePlanilha
    
    'Sprint 11 04/2017 - Permitir utilizar a área de transferência
    Boorel = False
    xl00Menu.Activate
    Application.EnableCancelKey = xlInterrupt
    protPlan.FinalizaRotina
    Set protPlan = Nothing
    Exit Sub
 
End Sub

Function ExportaProjetoCliente() As Integer
         Dim lngColCelFim As Long, lngLinCel As Long
         Dim lngColCel As Long
         On Error GoTo erroExportaProjetoCliente
         
         lngColCelFim = 114
         lngLinCel = 12
         xl00Dados.Activate
         Range("E" & lngLinCel).Select
         While ActiveCell.Column <= lngColCelFim
               ActiveCell.Value = xl01Cliente.Cells(lngLinCel, 5).Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
             
               If ActiveCell.Column = 27 Then
                  lngLinCel = lngLinCel + 1
                  ActiveCell.Offset(0, 1).Select
               End If
               If ActiveCell.Column = 35 Then
                  lngLinCel = lngLinCel + 2
               End If

               If ActiveCell.Column = 47 Then
                  lngLinCel = lngLinCel + 2
                  ActiveCell.Offset(0, 1).Select
               End If

               If ActiveCell.Column = 57 Then
                    lngLinCel = lngLinCel + 6
                    ActiveCell.Offset(0, 2).Select
               End If
               If ActiveCell.Column = 62 Then
                    lngLinCel = lngLinCel + 1
                    ActiveCell.Offset(0, 1).Select
               End If
               If ActiveCell.Column = 64 Then
                    lngLinCel = lngLinCel + 4
               End If
               If ActiveCell.Column = 83 Then
                    lngLinCel = lngLinCel + 5
               End If
                                 
         Wend
         ExportaProjetoCliente = 1
         Exit Function

erroExportaProjetoCliente:
         ExportaProjetoCliente = -1
End Function

Function ExportaProjetoAvaliacao() As Integer
         Dim lngLinCel As Long
         On Error GoTo erroExportaProjetoAvaliacao
         xl00Dados.Activate
         Range("E22").Select
         For lngLinCel = 22 To 24  'Imoveis vinculados ao plano
             Range("E" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] - 15).Value
             Range("F" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] - 15).Value
             Range("G" & [lngLinCel]).Value = xl02Aval.Range("K" & [lngLinCel] - 15).Value    'GSOL01924692 - INI NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018 de L PARA K
             Range("H" & [lngLinCel]).Value = xl02Aval.Range("L" & [lngLinCel] - 15).Value
             Range("I" & [lngLinCel]).Value = xl02Aval.Range("M" & [lngLinCel] - 15).Value
         Next lngLinCel
         Range("J22").Value = xl02Aval.Range("J43").Value
         Range("K22").Value = xl02Aval.Range("D10").Value
         For lngLinCel = 22 To 45  'Imovel 1: Terras e Coberturas
             Range("N" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] - 5).Value
             Range("O" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] - 5).Value
             Range("P" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] - 5).Value
             Range("Q" & [lngLinCel]).Value = xl02Aval.Range("J" & [lngLinCel] - 5).Value
         Next lngLinCel
         For lngLinCel = 22 To 41  'Imovel 1: Edificações/Instalações
             Range("T" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 27).Value
             Range("U" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 27).Value
             Range("V" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 27).Value
             Range("W" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] + 27).Value
             Range("X" & [lngLinCel]).Value = xl02Aval.Range("K" & [lngLinCel] + 27).Value
         Next lngLinCel
         
         Range("J23").Value = xl02Aval.Range("J103").Value
         For lngLinCel = 46 To 69  'Imovel 2: Terras e Coberturas
             Range("N" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 31).Value
             Range("O" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 31).Value
             Range("P" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 31).Value
             Range("Q" & [lngLinCel]).Value = xl02Aval.Range("J" & [lngLinCel] + 31).Value
         Next lngLinCel
         For lngLinCel = 42 To 61 'Imovel 2: Edificações/Instalações
             Range("T" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 67).Value
             Range("U" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 67).Value
             Range("V" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 67).Value
             Range("W" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] + 67).Value
             Range("X" & [lngLinCel]).Value = xl02Aval.Range("K" & [lngLinCel] + 67).Value
         Next lngLinCel
         Range("J24").Value = xl02Aval.Range("J163").Value
         For lngLinCel = 70 To 93  'Imovel 3: Terras e Coberturas
             Range("N" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 67).Value
             Range("O" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 67).Value
             Range("P" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 67).Value
             Range("Q" & [lngLinCel]).Value = xl02Aval.Range("J" & [lngLinCel] + 67).Value
         Next lngLinCel
         For lngLinCel = 64 To 83 'Imovel 3: Edificações/Instalações
             Range("T" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 105).Value
             Range("U" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 105).Value
             Range("V" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 105).Value
             Range("W" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] + 105).Value
             Range("X" & [lngLinCel]).Value = xl02Aval.Range("K" & [lngLinCel] + 105).Value
         Next lngLinCel
         For lngLinCel = 22 To 31  'Maquinas / Equipamentos
             Range("AA" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 171).Value
             Range("AB" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 171).Value
             Range("AC" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 171).Value
             Range("AD" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] + 171).Value
             Range("AE" & [lngLinCel]).Value = xl02Aval.Range("K" & [lngLinCel] + 171).Value
         Next lngLinCel
         For lngLinCel = 22 To 31  'Implementos / Veiculos
             Range("AH" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 185).Value
             Range("AI" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 185).Value
             Range("AJ" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 185).Value
             Range("AK" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] + 185).Value
             Range("AL" & [lngLinCel]).Value = xl02Aval.Range("K" & [lngLinCel] + 185).Value
         Next lngLinCel
         For lngLinCel = 22 To 31  'Móveis e Utensilios
             Range("AO" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 199).Value
             Range("AP" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 199).Value
             Range("AQ" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 199).Value
             Range("AR" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] + 199).Value
             Range("AS" & [lngLinCel]).Value = xl02Aval.Range("K" & [lngLinCel] + 199).Value
         Next lngLinCel
         '- Indicadores Semoventes
         Range("AV22").Value = xl02Aval.Range("A244").Value
         Range("AW22").Value = xl02Aval.Range("A245").Value
         Range("AV23").Value = xl02Aval.Range("A253").Value
         Range("AW23").Value = xl02Aval.Range("A254").Value
         Range("AV24").Value = xl02Aval.Range("A262").Value
         Range("AW24").Value = xl02Aval.Range("A263").Value
         Range("AV25").Value = xl02Aval.Range("A269").Value
         Range("AW25").Value = xl02Aval.Range("A270").Value
         Range("AV26").Value = xl02Aval.Range("A276").Value
         Range("AW26").Value = xl02Aval.Range("A277").Value
         For lngLinCel = 22 To 67  'Semoventes
             Range("AX" & [lngLinCel]).Value = xl02Aval.Range("D" & [lngLinCel] + 222).Value
             Range("AY" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 222).Value
             Range("AZ" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 222).Value
             Range("BA" & [lngLinCel]).Value = xl02Aval.Range("J" & [lngLinCel] + 222).Value
         Next lngLinCel
         
         For lngLinCel = 22 To 24  'Imóveis Vinculados ao Plano
             Range("BD" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 274).Value
             Range("BE" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 274).Value
             Range("BF" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] + 274).Value
             Range("BG" & [lngLinCel]).Value = xl02Aval.Range("J" & [lngLinCel] + 274).Value
             Range("BK" & [lngLinCel]).Value = xl02Aval.Range("L" & [lngLinCel] + 274).Value 'Número de Outorga de Água da Propriedade 18/08/2021 600512
             Range("BL" & [lngLinCel]).Value = xl02Aval.Range("M" & [lngLinCel] + 274).Value 'Percentual de Preservação da Propriedade Acima do Limite Legal 18/08/2021 600512
             Range("BM" & [lngLinCel]).Value = xl02Aval.Range("E" & [lngLinCel] + 280).Value 'S033 [1004790] -PLANILHAS - INCLUSÃO DE CAMPOS PARA OS IMÓVEIS - CATÁLOGO 5.08 - PRONAF
             Range("BN" & [lngLinCel]).Value = xl02Aval.Range("G" & [lngLinCel] + 280).Value 'S033 [1004790] -PLANILHAS - INCLUSÃO DE CAMPOS PARA OS IMÓVEIS - CATÁLOGO 5.08 - PRONAF
             Range("BO" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] + 280).Value 'S033 [1004790] -PLANILHAS - INCLUSÃO DE CAMPOS PARA OS IMÓVEIS - CATÁLOGO 5.08 - PRONAF
             Range("BP" & [lngLinCel]).Value = xl02Aval.Range("J" & [lngLinCel] + 280).Value 'S033 [1004790] -PLANILHAS - INCLUSÃO DE CAMPOS PARA OS IMÓVEIS - CATÁLOGO 5.08 - PRONAF
         Next lngLinCel
             
         'GSOL01924692 - INI NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018
         For lngLinCel = 22 To 24  'Nome do Proprietário e CPF
             Range("BH" & [lngLinCel]).Value = xl02Aval.Range("H" & [lngLinCel] - 15).Value
             Range("BI" & [lngLinCel]).Value = xl02Aval.Range("I" & [lngLinCel] - 15).Value
             Range("BJ" & [lngLinCel]).Value = xl02Aval.Range("J" & [lngLinCel] - 15).Value
         Next lngLinCel
        'GSOL01924692 - FIM NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018
             
         ExportaProjetoAvaliacao = 1
         Exit Function

erroExportaProjetoAvaliacao:
         ExportaProjetoAvaliacao = -1
End Function

Function ExportaProjetoProposta() As Integer
         Dim lngColCelFim As Long, lngLinCel As Long
         Dim lngColCel As Long
         
         On Error GoTo erroExportaProjetoProposta
         
         lngColCelFim = 21      'GSOL00921471 - RNM CAMPO REATIVADO EM 06/2015  - Alterado para 17 com a inclusão do campo Decreto Emergência - gsol00800821 ' RNM RETIRADA DECRETO DE EMERGENCIA EM 02/2015 GSOL00878462 VOLTAR AO 16
         lngLinCel = 5
         xl00Dados.Activate
         Range("E122").Select
         
         While ActiveCell.Column <= lngColCelFim     'Dados iniciais
               If lngLinCel = 16 Then
                  ActiveCell.Value = xl03Prop.Cells(5, 10).Value
               ElseIf lngLinCel = 17 Then                        'GSOL00921471 - RNM CAMPO REATIVADO EM 06/2015  - 'Alterado para 17 com a inclusão do campo Decreto Emergência - gsol00800821 ' RNM RETIRADA DECRETO DE EMERGENCIA EM 02/2015 GSOL00878462 VOLTAR AO 16
                  ActiveCell.Value = xl03Prop.Cells(9, 16).Value 'GSOL00921471 - RNM CAMPO REATIVADO EM 06/2015  - 'Alterado para 17 com a inclusão do campo Decreto Emergência - gsol00800821 ' RNM RETIRADA DECRETO DE EMERGENCIA EM 02/2015 GSOL00878462 VOLTAR AO 16
               
               ElseIf lngLinCel = 18 Then
                   ActiveCell.Value = xl03Prop.Cells(12, 16).Value
                                  
               ElseIf lngLinCel = 21 Then
                  ActiveCell.Value = xl03Prop.Cells(13, 16).Value
               
               Else
                  ActiveCell.Value = xl03Prop.Cells(lngLinCel, 5).Value     'Plano Safra 2016/2017 - verificar
               End If
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         
         Range("S122").Value = xl03Prop.Range("D22").Value
         Range("T122").Value = xl03Prop.Range("H22").Value
         Range("BM122").Value = xl03Prop.Range("N6").Value
         
         'Declaração de Ano de Renegociação GSOL00435468
         Range("I2").Value = xl03Prop.Range("P185").Value
         Range("I1").Value = xl03Prop.Range("D71").Value
         Range("J1").Value = xl03Prop.Range("AN184").Value
         
         'Declaração de Pessoas Politicamente Expostas
         Range("J2").Value = xl03Prop.Range("AN189").Value
         
         For lngLinCel = 122 To 157 'Inversões
             Range("W" & [lngLinCel]).Value = xl03Prop.Range("D" & [lngLinCel] - 95).Value
             Range("X" & [lngLinCel]).Value = xl03Prop.Range("E" & [lngLinCel] - 95).Value
             Range("Y" & [lngLinCel]).Value = xl03Prop.Range("F" & [lngLinCel] - 95).Value
             Range("Z" & [lngLinCel]).Value = xl03Prop.Range("G" & [lngLinCel] - 95).Value
             Range("AA" & [lngLinCel]).Value = xl03Prop.Range("H" & [lngLinCel] - 95).Value
             Range("AB" & [lngLinCel]).Value = xl03Prop.Range("J" & [lngLinCel] - 95).Value
             Range("AC" & [lngLinCel]).Value = xl03Prop.Range("I" & [lngLinCel] - 95).Value
             Range("AD" & [lngLinCel]).Value = xl03Prop.Range("L" & [lngLinCel] - 95).Value
         Next lngLinCel
         
        'DADOS DE IMÓVEIS VINCULADOS AO PLANO
         Range("BD25").Value = xl03Prop.Range("AO22").Value
         Range("BE25").Value = xl03Prop.Range("AP22").Value
         Range("BF25").Value = xl03Prop.Range("AQ22").Value
         Range("BG25").Value = xl03Prop.Range("AR22").Value
         Range("BK25").Value = xl03Prop.Range("AM22").Value   ' 13082022
         Range("BL25").Value = xl03Prop.Range("AN22").Value   ' 13082022
         
         'GSOL01924692 - INI NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018
         Range("BH25").Value = xl03Prop.Range("AS22").Value
         Range("BI25").Value = xl03Prop.Range("AT22").Value
         Range("BJ25").Value = xl03Prop.Range("AU22").Value
         'GSOL01924692 - FIM NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018
         
         Range("AB158").Value = xl03Prop.Range("J64").Value
         Range("AD158").Value = xl03Prop.Range("L64").Value
         Range("AB159").Value = xl03Prop.Range("J65").Value
         Range("AD159").Value = xl03Prop.Range("L65").Value
         Range("AA160").Value = xl03Prop.Range("H69").Value
         Range("AD160").Value = xl03Prop.Range("L69").Value
         
         For lngLinCel = 122 To 126 'Financiamentos existentes
             Range("AG" & [lngLinCel]).Value = xl03Prop.Range("D" & [lngLinCel] + 7).Value
             Range("AH" & [lngLinCel]).Value = xl03Prop.Range("G" & [lngLinCel] + 7).Value
             Range("BR" & [lngLinCel]).Value = xl03Prop.Range("I" & [lngLinCel] + 7).Value
             Range("BS" & [lngLinCel]).Value = xl03Prop.Range("J" & [lngLinCel] + 7).Value
             Range("AI" & [lngLinCel]).Value = xl03Prop.Range("K" & [lngLinCel] + 7).Value
             Range("AJ" & [lngLinCel]).Value = xl03Prop.Range("L" & [lngLinCel] + 7).Value
             Range("AK" & [lngLinCel]).Value = xl03Prop.Range("N" & [lngLinCel] + 7).Value
             Range("BP" & [lngLinCel]).Value = xl03Prop.Range("O" & [lngLinCel] + 7).Value
         Next lngLinCel
         
         'Garantias
         Range("AN122").Value = xl03Prop.Range("Y136").Value
         Range("AO122").Value = xl03Prop.Range("E136").Value
         Range("AP122").Value = xl03Prop.Range("E137").Value
         Range("AQ122").Value = xl03Prop.Range("H137").Value
         Range("AR122").Value = xl03Prop.Range("M136").Value
         Range("AS122").Value = xl03Prop.Range("M137").Value
         
         Range("AN123").Value = xl03Prop.Range("Y138").Value
         Range("AO123").Value = xl03Prop.Range("E138").Value
         Range("AP123").Value = xl03Prop.Range("E139").Value
         Range("AQ123").Value = xl03Prop.Range("H139").Value
         Range("AR123").Value = xl03Prop.Range("M138").Value
         Range("AS123").Value = xl03Prop.Range("M139").Value

         Range("BA122").Value = xl03Prop.Range("D155").Value
         Range("BB122").Value = xl03Prop.Range("E155").Value
         Range("BD122").Value = xl03Prop.Range("D158").Value
         Range("BE122").Value = xl03Prop.Range("D160").Value
         
         'Opção da declaração
         Range("BF122").Value = xl03Prop.Range("Y161").Value
         
         'Tipo de custo de assessoria informado (% ou R$)
         Range("BQ122").Value = xl03Prop.Range("H71").Value

         'GSOL00094929 - alterados parâmetros da declaração
         For lngLinCel = 122 To 129
             Range("BG" & [lngLinCel]).Value = xl03Prop.Range("D" & [lngLinCel] + 44).Value
             Range("BH" & [lngLinCel]).Value = xl03Prop.Range("F" & [lngLinCel] + 44).Value
             Range("BI" & [lngLinCel]).Value = xl03Prop.Range("H" & [lngLinCel] + 44).Value
             Range("BJ" & [lngLinCel]).Value = xl03Prop.Range("J" & [lngLinCel] + 44).Value
             Range("BK" & [lngLinCel]).Value = xl03Prop.Range("L" & [lngLinCel] + 44).Value
             Range("BL" & [lngLinCel]).Value = xl03Prop.Range("N" & [lngLinCel] + 44).Value
             Range("BO" & [lngLinCel]).Value = xl03Prop.Range("O" & [lngLinCel] + 44).Value
         Next lngLinCel
         
         'GSOL00083049
         Range("BN122").Value = xl00Visao.Range("FP12").Value
         Range("BN123").Value = xl00Visao.Range("FP13").Value
         Range("BN124").Value = xl00Visao.Range("FP14").Value
         Range("BN125").Value = xl00Visao.Range("FP15").Value
         
         'GSOL01921068 - SEAP/PLANILHAS-PLANO SAFRA 2018/2019 - RNM - INI 25/07/2018
         Range("BT122").Value = xl03Prop.Range("AN193").Value
         'GSOL01921068 - SEAP/PLANILHAS-PLANO SAFRA 2018/2019 - RNM - FIM 25/07/2018
         
         ExportaProjetoProposta = 1
         Exit Function

erroExportaProjetoProposta:
         ExportaProjetoProposta = -1
End Function

Function ExportaProjetoCronograma() As Integer
         Dim lngLinBD As Long, lngLinCel As Long
         On Error GoTo erroExportaProjetoCronograma
         xl00Dados.Activate
         Range("E222").Select
         lngLinCel = 207
         For lngLinBD = 222 To 260
             Range("E" & [lngLinBD]).Value = xl04Crono.Range("J" & [lngLinBD] - [lngLinCel]).Text
             Range("F" & [lngLinBD]).Value = xl04Crono.Range("K" & [lngLinBD] - [lngLinCel]).Text
             Range("G" & [lngLinBD]).Value = xl04Crono.Range("L" & [lngLinBD] - [lngLinCel]).Text
             Range("H" & [lngLinBD]).Value = xl04Crono.Range("M" & [lngLinBD] - [lngLinCel]).Text
             Range("I" & [lngLinBD]).Value = xl04Crono.Range("N" & [lngLinBD] - [lngLinCel]).Text  'Sprint 11 04/2017 - Permitir utilizar a área de transferência
             
             Range("M" & [lngLinBD]).Value = xl04Crono.Range("J" & [lngLinBD] - [lngLinCel] + 1).Value
             Range("N" & [lngLinBD]).Value = xl04Crono.Range("K" & [lngLinBD] - [lngLinCel] + 1).Value
             Range("O" & [lngLinBD]).Value = xl04Crono.Range("L" & [lngLinBD] - [lngLinCel] + 1).Value
             Range("P" & [lngLinBD]).Value = xl04Crono.Range("M" & [lngLinBD] - [lngLinCel] + 1).Value
             lngLinCel = lngLinCel - 2
             
             Range("W" & [lngLinBD]).Value = xl04Crono.Range("J" & [lngLinBD] - 20).Value
             
             'GSOL01931222 - Inclusão de área de apascentamento  RNM
             Range("AF" & [lngLinBD]).Value = xl04Crono.Range("F" & [lngLinBD] - 20).Value
             
             'GSOL00663906 EXPORTAÇÃO DA PROPOSTA (CRONOGRAMA) INI RNM
             Range("Z" & [lngLinBD]).Value = xl04Crono.Range("AC" & [lngLinBD] - 20).Value 'Desc Unidade
             Range("AA" & [lngLinBD]).Value = xl04Crono.Range("Z" & [lngLinBD] - 20).Value  'Cod Empreendimento
             Range("AB" & [lngLinBD]).Value = xl04Crono.Range("AB" & [lngLinBD] - 20).Value 'Cod Sist Produção
             'GSOL00663906 EXPORTAÇÃO DA PROPOSTA (CRONOGRAMA) FIM
             
             'RTC 31115 - Plano Safra 2016/2017 INI RNM
             Range("AE" & [lngLinBD]).Value = xl04Crono.Range("G" & [lngLinBD] + 21).Value
             'RTC 31115 - Plano Safra 2016/2017 INI RNM
             
             'Inclusão do item MDA E CFI GSOL00800821 - RNM INI
             Range("AC" & [lngLinBD]).Value = xl04Crono.Range("L" & [lngLinBD] + 21).Value 'CÓDIGO MDA
             Range("AD" & [lngLinBD]).Value = xl04Crono.Range("M" & [lngLinBD] + 21).Value  'CÓDIGO CFI/BNDES
             'Inclusão do item MDA E CFI GSOL00800821 - RNM FIM
             
         Next lngLinBD

         'Atividade PGPAF
         Range("H761").Value = xl04Crono.Range("J314").Value

         ExportaProjetoCronograma = 1
         Exit Function

erroExportaProjetoCronograma:
         ExportaProjetoCronograma = -1
End Function

Function ExportaProjetoCoordGeodesicas() As Integer
         Dim lngLinBD As Long, lngLinCel As Long
         On Error GoTo erroExportaProjetoCoordGeodesicas
        
        'COORDENADAS GEODESICAS  RNM - GSOL00969220 21/12/2015
        'Alocar a informação de Glebas de Inversões
        Application.ScreenUpdating = False
        bd10Geodesica.Activate
        bd10Geodesica.Range("C101:O" & bd10Geodesica.Range("B99").Value + 100).Select
        Selection.Copy
        
        xl00Dados.Activate
        'Range("HB2:HN10").ClearContents
        Range("HA2").Select
        Range("HA1").Value = bd10Geodesica.Range("B99").Value + 100
        Range("HA2").Select
        Selection.PasteSpecial Paste:=xlValues, Operation:=xlNone, SkipBlanks:= _
                  True, Transpose:=False
        Selection.PasteSpecial Paste:=xlFormats, Operation:=xlNone, SkipBlanks:= _
                  True, Transpose:=False
        'Término de coordenadas geodésica
        'COORDENADAS GEODESICAS  RNM - GSOL00969220 21/12/2015
    
        ExportaProjetoCoordGeodesicas = 1
        Call Limpar_Gleba '28/10/2020
        'Chamado limpar projeto Geodesica 25/11/2020
        Call Limpar_Geodesica

        
        Exit Function

erroExportaProjetoCoordGeodesicas:
        ExportaProjetoCoordGeodesicas = -1
End Function
'Function ExportaProjetoCoordGeodesicas() As Integer
'         Dim lngLinBD As Long, lngLinCel As Long
'         On Error GoTo erroExportaProjetoCoordGeodesicas
'
'        'Sprint 11 04/2017 - Permitir utilizar a área de transferência
'        Boorel = True
'
'        'COORDENADAS GEODESICAS  RNM - GSOL00969220 25/01/2016
'        'Alocar a informação de Glebas de Inversões
'        Application.ScreenUpdating = False
'        'Limpar a área para nova proposta
'
'
'        bd10Geodesica.Activate
'        bd10Geodesica.Calculate
'
'        Range("HA3:HM" & Rows.Count).ClearContents
'
'
'        Call CargaIniGeodesica
'        Call LimparGlebasSemInv
'
'        Application.ScreenUpdating = False
'
'        Range("C101:O" & bd10Geodesica.Range("B99").Value + 100).Select
'
'        Selection.Copy
'
'        xl00Dados.Activate
'        Range("HA2").Select
'        Range("HA1").Value = bd10Geodesica.Range("B99").Value + 100
'        Range("HA2").Select
'        Selection.PasteSpecial Paste:=xlValues, Operation:=xlNone, SkipBlanks:= _
'                  True, Transpose:=False
'        Selection.PasteSpecial Paste:=xlFormats, Operation:=xlNone, SkipBlanks:= _
'                  True, Transpose:=False
'
'        'Sprint 11 04/2017 - Nova coluna de Status de digitação INI
'        bd10Geodesica.Activate
'        bd10Geodesica.Calculate
'        bd10Geodesica.Range("T101:T" & bd10Geodesica.Range("B99").Value + 100).Select
'        Selection.Copy
'
'        'Sprint 11
'        xl00Dados.Activate
'        Range("HN2").Select
'        Selection.PasteSpecial Paste:=xlValues, Operation:=xlNone, SkipBlanks:= _
'                  True, Transpose:=False
'        Selection.PasteSpecial Paste:=xlFormats, Operation:=xlNone, SkipBlanks:= _
'                  True, Transpose:=False
'
'        'Sprint 11  04/2017 - Término de coordenadas geodésica
'        'COORDENADAS GEODESICAS  RNM - GSOL00969220 25/01/2016
'
'        ExportaProjetoCoordGeodesicas = 1
'        'Sprint 11 04/2017 - Permitir utilizar a área de transferência
'        Boorel = False
'        Exit Function
'
'erroExportaProjetoCoordGeodesicas:
'        'Sprint 11 04/2017 - Permitir utilizar a área de transferência
'        Boorel = False
'        ExportaProjetoCoordGeodesicas = -1
'End Function

Function ExportaProjetoAtivAgricola() As Integer
         Dim lngLinBD As Long, lngLinCel As Long, lngColCel As Long
         On Error GoTo erroExportaProjetoAtivAgricola
         
         'Sprint 11 04/2017 - Permitir utilizar a área de transferência
         Boorel = True
         
         xl00Dados.Activate
         Range("F322").Select
         For lngLinBD = 322 To 392 'Uso atual e projetado
             For lngColCel = 5 To 38
                  Cells([lngLinBD], [lngColCel]).Value = xl05AtivAgri.Cells([lngLinBD] - 314, [lngColCel])
                  If lngLinBD <> 357 Then Cells([lngLinBD], "D").Value = xl05AtivAgri.Cells([lngLinBD] - 314, "D")
             Next lngColCel
         Next lngLinBD
         'GSOL00277827
         For lngLinBD = 322 To 392 'Uso atual e projetado anos 17-30
             For lngColCel = 157 To 184
                  Cells([lngLinBD], [lngColCel]).Value = xl05AtivAgri.Cells([lngLinBD] - 314, [lngColCel] - 118)
             Next lngColCel
         Next lngLinBD
         
         Range("AX322").Value = xl05AtivAgri.Range("A122").Value
         For lngLinBD = 322 To 356  'Receitas agrícolas
             Range("BA" & [lngLinBD]).Value = xl05AtivAgri.Range("E" & [lngLinBD] - 237).Value
             Range("BB" & [lngLinBD]).Value = xl05AtivAgri.Range("G" & [lngLinBD] - 237).Value
             Range("BC" & [lngLinBD]).Value = xl05AtivAgri.Range("I" & [lngLinBD] - 237).Value
             Range("BD" & [lngLinBD]).Value = xl05AtivAgri.Range("K" & [lngLinBD] - 237).Value
             Range("BE" & [lngLinBD]).Value = xl05AtivAgri.Range("L" & [lngLinBD] - 237).Value
             Range("BF" & [lngLinBD]).Value = xl05AtivAgri.Range("M" & [lngLinBD] - 237).Value
             Range("BG" & [lngLinBD]).Value = xl05AtivAgri.Range("N" & [lngLinBD] - 237).Value
             Range("BH" & [lngLinBD]).Value = xl05AtivAgri.Range("O" & [lngLinBD] - 237).Value
             Range("BI" & [lngLinBD]).Value = xl05AtivAgri.Range("P" & [lngLinBD] - 237).Value
             Range("BJ" & [lngLinBD]).Value = xl05AtivAgri.Range("Q" & [lngLinBD] - 237).Value
             Range("BK" & [lngLinBD]).Value = xl05AtivAgri.Range("R" & [lngLinBD] - 237).Value
             Range("BL" & [lngLinBD]).Value = xl05AtivAgri.Range("S" & [lngLinBD] - 237).Value
             Range("BM" & [lngLinBD]).Value = xl05AtivAgri.Range("T" & [lngLinBD] - 237).Value
             Range("BN" & [lngLinBD]).Value = xl05AtivAgri.Range("U" & [lngLinBD] - 237).Value
             Range("BO" & [lngLinBD]).Value = xl05AtivAgri.Range("V" & [lngLinBD] - 237).Value
             Range("BP" & [lngLinBD]).Value = xl05AtivAgri.Range("W" & [lngLinBD] - 237).Value
             Range("BQ" & [lngLinBD]).Value = xl05AtivAgri.Range("X" & [lngLinBD] - 237).Value
             Range("BR" & [lngLinBD]).Value = xl05AtivAgri.Range("Y" & [lngLinBD] - 237).Value
             Range("BS" & [lngLinBD]).Value = xl05AtivAgri.Range("Z" & [lngLinBD] - 237).Value
             Range("BT" & [lngLinBD]).Value = xl05AtivAgri.Range("AA" & [lngLinBD] - 237).Value
             'GSOL00277827
             Range("EA" & [lngLinBD]).Value = xl05AtivAgri.Range("AB" & [lngLinBD] - 237).Value
             Range("EB" & [lngLinBD]).Value = xl05AtivAgri.Range("AC" & [lngLinBD] - 237).Value
             Range("EC" & [lngLinBD]).Value = xl05AtivAgri.Range("AD" & [lngLinBD] - 237).Value
             Range("ED" & [lngLinBD]).Value = xl05AtivAgri.Range("AE" & [lngLinBD] - 237).Value
             Range("EE" & [lngLinBD]).Value = xl05AtivAgri.Range("AF" & [lngLinBD] - 237).Value
             Range("EF" & [lngLinBD]).Value = xl05AtivAgri.Range("AG" & [lngLinBD] - 237).Value
             Range("EG" & [lngLinBD]).Value = xl05AtivAgri.Range("AH" & [lngLinBD] - 237).Value
             Range("EH" & [lngLinBD]).Value = xl05AtivAgri.Range("AI" & [lngLinBD] - 237).Value
             Range("EI" & [lngLinBD]).Value = xl05AtivAgri.Range("AJ" & [lngLinBD] - 237).Value
             Range("EJ" & [lngLinBD]).Value = xl05AtivAgri.Range("AK" & [lngLinBD] - 237).Value
             Range("EK" & [lngLinBD]).Value = xl05AtivAgri.Range("AL" & [lngLinBD] - 237).Value
             Range("EL" & [lngLinBD]).Value = xl05AtivAgri.Range("AM" & [lngLinBD] - 237).Value
             Range("EM" & [lngLinBD]).Value = xl05AtivAgri.Range("AN" & [lngLinBD] - 237).Value
             Range("EN" & [lngLinBD]).Value = xl05AtivAgri.Range("AO" & [lngLinBD] - 237).Value
         Next lngLinBD
         For lngLinBD = 322 To 366  'Custos agrícolas
             Range("CA" & [lngLinBD]).Value = xl05AtivAgri.Range("E" & [lngLinBD] - 196).Value
             Range("CB" & [lngLinBD]).Value = xl05AtivAgri.Range("G" & [lngLinBD] - 196).Value
             Range("CC" & [lngLinBD]).Value = xl05AtivAgri.Range("I" & [lngLinBD] - 196).Value
             Range("CD" & [lngLinBD]).Value = xl05AtivAgri.Range("K" & [lngLinBD] - 196).Value
             Range("CE" & [lngLinBD]).Value = xl05AtivAgri.Range("M" & [lngLinBD] - 196).Value
             Range("CF" & [lngLinBD]).Value = xl05AtivAgri.Range("O" & [lngLinBD] - 196).Value
             Range("CG" & [lngLinBD]).Value = xl05AtivAgri.Range("Q" & [lngLinBD] - 196).Value
             Range("CH" & [lngLinBD]).Value = xl05AtivAgri.Range("S" & [lngLinBD] - 196).Value
             Range("CI" & [lngLinBD]).Value = xl05AtivAgri.Range("U" & [lngLinBD] - 196).Value
             Range("CJ" & [lngLinBD]).Value = xl05AtivAgri.Range("W" & [lngLinBD] - 196).Value
             Range("CK" & [lngLinBD]).Value = xl05AtivAgri.Range("Y" & [lngLinBD] - 196).Value
             Range("CL" & [lngLinBD]).Value = xl05AtivAgri.Range("AA" & [lngLinBD] - 196).Value
             Range("CM" & [lngLinBD]).Value = xl05AtivAgri.Range("AC" & [lngLinBD] - 196).Value
             Range("CN" & [lngLinBD]).Value = xl05AtivAgri.Range("AE" & [lngLinBD] - 196).Value
             Range("CO" & [lngLinBD]).Value = xl05AtivAgri.Range("AG" & [lngLinBD] - 196).Value
             Range("CP" & [lngLinBD]).Value = xl05AtivAgri.Range("AI" & [lngLinBD] - 196).Value
             Range("CQ" & [lngLinBD]).Value = xl05AtivAgri.Range("AK" & [lngLinBD] - 196).Value
             'GSOL00277827
             Range("CR" & [lngLinBD]).Value = xl05AtivAgri.Range("AM" & [lngLinBD] - 196).Value
             Range("CS" & [lngLinBD]).Value = xl05AtivAgri.Range("AO" & [lngLinBD] - 196).Value
             Range("CT" & [lngLinBD]).Value = xl05AtivAgri.Range("AQ" & [lngLinBD] - 196).Value
             Range("CU" & [lngLinBD]).Value = xl05AtivAgri.Range("AS" & [lngLinBD] - 196).Value
             Range("CV" & [lngLinBD]).Value = xl05AtivAgri.Range("AU" & [lngLinBD] - 196).Value
             Range("CW" & [lngLinBD]).Value = xl05AtivAgri.Range("AW" & [lngLinBD] - 196).Value
             Range("CX" & [lngLinBD]).Value = xl05AtivAgri.Range("AY" & [lngLinBD] - 196).Value
             Range("CY" & [lngLinBD]).Value = xl05AtivAgri.Range("BA" & [lngLinBD] - 196).Value
             Range("CZ" & [lngLinBD]).Value = xl05AtivAgri.Range("BC" & [lngLinBD] - 196).Value
             Range("DA" & [lngLinBD]).Value = xl05AtivAgri.Range("BE" & [lngLinBD] - 196).Value
             Range("DB" & [lngLinBD]).Value = xl05AtivAgri.Range("BG" & [lngLinBD] - 196).Value
             Range("DC" & [lngLinBD]).Value = xl05AtivAgri.Range("BI" & [lngLinBD] - 196).Value
             Range("DD" & [lngLinBD]).Value = xl05AtivAgri.Range("BK" & [lngLinBD] - 196).Value
             Range("DE" & [lngLinBD]).Value = xl05AtivAgri.Range("BM" & [lngLinBD] - 196).Value
         Next lngLinBD

         For lngLinBD = 762 To 796  'Atividades Econômicas
             Range("E" & [lngLinBD]).Value = xl05AtivAgri.Range("D" & [lngLinBD] - 596).Value
             Range("F" & [lngLinBD]).Value = xl05AtivAgri.Range("E" & [lngLinBD] - 596).Value
         Next lngLinBD
         
         ExportaProjetoAtivAgricola = 1
         'Sprint 11 04/2017 - Permitir utilizar a área de transferência
         Boorel = False
         Exit Function

erroExportaProjetoAtivAgricola:
         'Sprint 11 04/2017 - Permitir utilizar a área de transferência
         Boorel = False
         ExportaProjetoAtivAgricola = -1
End Function

Function ExportaProjetoAtivPecuaria() As Integer
         Dim lngLinBD As Long, lngLinCel As Long
         On Error GoTo erroExportaProjetoAtivPecuaria
         'Sprint 11 04/2017 - Permitir utilizar a área de transferência
         Boorel = True
         
         xl00Dados.Activate
         Range("E422").Select
         Range("E422").Value = xl06AtivPec.Range("A13").Value
         Range("F422").Value = xl06AtivPec.Range("A14").Value
         Range("G422").Value = xl06AtivPec.Range("A16").Value
         Range("E423").Value = xl06AtivPec.Range("A35").Value
         Range("F423").Value = xl06AtivPec.Range("A36").Value
         Range("G423").Value = xl06AtivPec.Range("A38").Value
         Range("E424").Value = xl06AtivPec.Range("A52").Value
         Range("F424").Value = xl06AtivPec.Range("A53").Value
         Range("G424").Value = xl06AtivPec.Range("A55").Value
         Range("E425").Value = xl06AtivPec.Range("A68").Value
         Range("F425").Value = xl06AtivPec.Range("A69").Value
         Range("G425").Value = xl06AtivPec.Range("A71").Value
         
         '--- Bovino Leite
         Range("H422").Value = xl06AtivPec.Range("G17").Value
         Range("I422").Value = xl06AtivPec.Range("I17").Value
         For lngLinBD = 423 To 429
             Range("H" & [lngLinBD]).Value = xl06AtivPec.Range("G" & [lngLinBD] - 405).Value
             Range("I" & [lngLinBD]).Value = xl06AtivPec.Range("I" & [lngLinBD] - 405).Value
             Range("J" & [lngLinBD]).Value = xl06AtivPec.Range("N" & [lngLinBD] - 405).Value
             Range("K" & [lngLinBD]).Value = xl06AtivPec.Range("O" & [lngLinBD] - 405).Value
             Range("L" & [lngLinBD]).Value = xl06AtivPec.Range("P" & [lngLinBD] - 405).Value
         Next lngLinBD
         Range("M422").Select
         lngLinCel = 27
         While ActiveCell.Column <= 18
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "G").Value
               If lngLinCel = 27 Then
                  lngLinCel = lngLinCel + 2
               Else
                  lngLinCel = lngLinCel + 1
               End If
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 27
         While ActiveCell.Column <= 24
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "Q").Value
               If lngLinCel = 28 Then
                  lngLinCel = lngLinCel + 2
               Else
                  lngLinCel = lngLinCel + 1
               End If
               ActiveCell.Offset(0, 1).Select
         Wend
         '--- Bovino Corte
         Range("H430").Value = xl06AtivPec.Range("G39").Value
         Range("I430").Value = xl06AtivPec.Range("I39").Value
         For lngLinBD = 431 To 437
             Range("H" & [lngLinBD]).Value = xl06AtivPec.Range("G" & [lngLinBD] - 391).Value
             Range("I" & [lngLinBD]).Value = xl06AtivPec.Range("I" & [lngLinBD] - 391).Value
             Range("J" & [lngLinBD]).Value = xl06AtivPec.Range("N" & [lngLinBD] - 391).Value
             Range("K" & [lngLinBD]).Value = xl06AtivPec.Range("O" & [lngLinBD] - 391).Value
             Range("L" & [lngLinBD]).Value = xl06AtivPec.Range("P" & [lngLinBD] - 391).Value
         Next lngLinBD
         Range("M430").Select
         lngLinCel = 48
         While ActiveCell.Column <= 15
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "G").Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 48
         While ActiveCell.Column <= 18
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "Q").Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         '--- Ovino
         Range("H438").Value = xl06AtivPec.Range("G56").Value
         Range("I438").Value = xl06AtivPec.Range("I56").Value
         For lngLinBD = 439 To 443
             Range("H" & [lngLinBD]).Value = xl06AtivPec.Range("G" & [lngLinBD] - 382).Value
             Range("I" & [lngLinBD]).Value = xl06AtivPec.Range("I" & [lngLinBD] - 382).Value
             Range("J" & [lngLinBD]).Value = xl06AtivPec.Range("N" & [lngLinBD] - 382).Value
             Range("K" & [lngLinBD]).Value = xl06AtivPec.Range("O" & [lngLinBD] - 382).Value
             Range("L" & [lngLinBD]).Value = xl06AtivPec.Range("P" & [lngLinBD] - 382).Value
         Next lngLinBD
         Range("M438").Select
         lngLinCel = 63
         While ActiveCell.Column <= 16
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "G").Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 63
         While ActiveCell.Column <= 19
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "Q").Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         '--- Caprino
         Range("H444").Value = xl06AtivPec.Range("G72").Value
         Range("I444").Value = xl06AtivPec.Range("I72").Value
         For lngLinBD = 445 To 449
             Range("H" & [lngLinBD]).Value = xl06AtivPec.Range("G" & [lngLinBD] - 372).Value
             Range("I" & [lngLinBD]).Value = xl06AtivPec.Range("I" & [lngLinBD] - 372).Value
             Range("J" & [lngLinBD]).Value = xl06AtivPec.Range("N" & [lngLinBD] - 372).Value
             Range("K" & [lngLinBD]).Value = xl06AtivPec.Range("O" & [lngLinBD] - 372).Value
             Range("L" & [lngLinBD]).Value = xl06AtivPec.Range("P" & [lngLinBD] - 372).Value
         Next lngLinBD
         Range("M444").Select
         lngLinCel = 79
         While ActiveCell.Column <= 16
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "G").Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 79
         While ActiveCell.Column <= 19
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "L").Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 79
         While ActiveCell.Column <= 22
               ActiveCell.Value = xl06AtivPec.Cells([lngLinCel], "Q").Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         '--- Custos Bovino Leite
         For lngLinBD = 422 To 429
             Range("AA" & [lngLinBD]).Value = xl06AtivPec.Range("G" & [lngLinBD] - 332).Value
             Range("AB" & [lngLinBD]).Value = xl06AtivPec.Range("J" & [lngLinBD] - 332).Value
             Range("AC" & [lngLinBD]).Value = xl06AtivPec.Range("L" & [lngLinBD] - 332).Value
             Range("AD" & [lngLinBD]).Value = xl06AtivPec.Range("N" & [lngLinBD] - 332).Value
         Next lngLinBD
         Range("AE422").Value = xl06AtivPec.Range("G98").Value
         Range("AF422").Value = xl06AtivPec.Range("F85").Value
         '--- Custos Bovino corte
         For lngLinBD = 430 To 437
             Range("AA" & [lngLinBD]).Value = xl06AtivPec.Range("G" & [lngLinBD] - 327).Value
             Range("AB" & [lngLinBD]).Value = xl06AtivPec.Range("J" & [lngLinBD] - 327).Value
             Range("AC" & [lngLinBD]).Value = xl06AtivPec.Range("L" & [lngLinBD] - 327).Value
             Range("AD" & [lngLinBD]).Value = xl06AtivPec.Range("N" & [lngLinBD] - 327).Value
         Next lngLinBD
         Range("AE423").Value = xl06AtivPec.Range("G111").Value
         '--- Custos Ovino
         For lngLinBD = 438 To 443
             Range("AA" & [lngLinBD]).Value = xl06AtivPec.Range("G" & [lngLinBD] - 322).Value
             Range("AB" & [lngLinBD]).Value = xl06AtivPec.Range("J" & [lngLinBD] - 322).Value
             Range("AC" & [lngLinBD]).Value = xl06AtivPec.Range("L" & [lngLinBD] - 322).Value
             Range("AD" & [lngLinBD]).Value = xl06AtivPec.Range("N" & [lngLinBD] - 322).Value
         Next lngLinBD
         Range("AE424").Value = xl06AtivPec.Range("G122").Value
         '--- Custos Caprino
         For lngLinBD = 444 To 449
             Range("AA" & [lngLinBD]).Value = xl06AtivPec.Range("G" & [lngLinBD] - 317).Value
             Range("AB" & [lngLinBD]).Value = xl06AtivPec.Range("J" & [lngLinBD] - 317).Value
             Range("AC" & [lngLinBD]).Value = xl06AtivPec.Range("L" & [lngLinBD] - 317).Value
             Range("AD" & [lngLinBD]).Value = xl06AtivPec.Range("N" & [lngLinBD] - 317).Value
         Next lngLinBD
         Range("AE425").Value = xl06AtivPec.Range("G133").Value
         '--- Custos Agricola
         For lngLinBD = 422 To 456
             Range("AG" & [lngLinBD]).Value = xl06AtivPec.Range("L" & [lngLinBD] - 285).Value
         Next lngLinBD

         For lngLinBD = 797 To 800  'Atividades Econômicas
             Range("F" & [lngLinBD]).Value = xl06AtivPec.Range("L" & [lngLinBD] - 790).Value
         Next lngLinBD
         
         ExportaProjetoAtivPecuaria = 1
         'Sprint 11 04/2017 - Permitir utilizar a área de transferência
         Boorel = False
         Exit Function

erroExportaProjetoAtivPecuaria:
         'Sprint 11 04/2017 - Permitir utilizar a área de transferência
         Boorel = False
         ExportaProjetoAtivPecuaria = -1
End Function

Function ExportaProjetoOutraAtiv() As Integer
         Dim lngLinBD As Long, lngColBD As Long
         On Error GoTo erroExportaProjetoOutraAtiv
         'Sprint 11 04/2017 - Permitir utilizar a área de transferência
         Boorel = True
         
         xl00Dados.Activate
         Range("E522").Select
         
         For lngLinBD = 522 To 531
             Range("E" & [lngLinBD]).Value = xl07OutAtv.Range("D" & [lngLinBD] - 507).Value
             Range("F" & [lngLinBD]).Value = xl07OutAtv.Range("E" & [lngLinBD] - 507).Value
             Range("G" & [lngLinBD]).Value = xl07OutAtv.Range("F" & [lngLinBD] - 507).Value
             Range("H" & [lngLinBD]).Value = xl07OutAtv.Range("F" & [lngLinBD] - 476).Value
             Range("I" & [lngLinBD]).Value = xl07OutAtv.Range("G" & [lngLinBD] - 507).Value
             Range("J" & [lngLinBD]).Value = xl07OutAtv.Range("G" & [lngLinBD] - 476).Value
             Range("K" & [lngLinBD]).Value = xl07OutAtv.Range("H" & [lngLinBD] - 507).Value
             Range("L" & [lngLinBD]).Value = xl07OutAtv.Range("H" & [lngLinBD] - 476).Value
             Range("M" & [lngLinBD]).Value = xl07OutAtv.Range("I" & [lngLinBD] - 507).Value
             Range("N" & [lngLinBD]).Value = xl07OutAtv.Range("I" & [lngLinBD] - 476).Value
             Range("O" & [lngLinBD]).Value = xl07OutAtv.Range("J" & [lngLinBD] - 507).Value
             Range("P" & [lngLinBD]).Value = xl07OutAtv.Range("J" & [lngLinBD] - 476).Value
             Range("Q" & [lngLinBD]).Value = xl07OutAtv.Range("K" & [lngLinBD] - 507).Value
             Range("R" & [lngLinBD]).Value = xl07OutAtv.Range("K" & [lngLinBD] - 476).Value
             Range("S" & [lngLinBD]).Value = xl07OutAtv.Range("L" & [lngLinBD] - 507).Value
             Range("T" & [lngLinBD]).Value = xl07OutAtv.Range("L" & [lngLinBD] - 476).Value
             Range("U" & [lngLinBD]).Value = xl07OutAtv.Range("M" & [lngLinBD] - 507).Value
             Range("V" & [lngLinBD]).Value = xl07OutAtv.Range("M" & [lngLinBD] - 476).Value
             Range("W" & [lngLinBD]).Value = xl07OutAtv.Range("N" & [lngLinBD] - 507).Value
             Range("X" & [lngLinBD]).Value = xl07OutAtv.Range("N" & [lngLinBD] - 476).Value
             Range("Y" & [lngLinBD]).Value = xl07OutAtv.Range("O" & [lngLinBD] - 507).Value
             Range("Z" & [lngLinBD]).Value = xl07OutAtv.Range("O" & [lngLinBD] - 476).Value
             Range("AA" & [lngLinBD]).Value = xl07OutAtv.Range("P" & [lngLinBD] - 507).Value
             Range("AB" & [lngLinBD]).Value = xl07OutAtv.Range("P" & [lngLinBD] - 476).Value
             Range("AC" & [lngLinBD]).Value = xl07OutAtv.Range("Q" & [lngLinBD] - 507).Value
             Range("AD" & [lngLinBD]).Value = xl07OutAtv.Range("Q" & [lngLinBD] - 476).Value
             Range("AE" & [lngLinBD]).Value = xl07OutAtv.Range("R" & [lngLinBD] - 507).Value
             Range("AF" & [lngLinBD]).Value = xl07OutAtv.Range("R" & [lngLinBD] - 476).Value
             Range("AG" & [lngLinBD]).Value = xl07OutAtv.Range("S" & [lngLinBD] - 507).Value
             Range("AH" & [lngLinBD]).Value = xl07OutAtv.Range("S" & [lngLinBD] - 476).Value
             Range("AI" & [lngLinBD]).Value = xl07OutAtv.Range("T" & [lngLinBD] - 507).Value
             Range("AJ" & [lngLinBD]).Value = xl07OutAtv.Range("T" & [lngLinBD] - 476).Value
             Range("AK" & [lngLinBD]).Value = xl07OutAtv.Range("U" & [lngLinBD] - 507).Value
             Range("AL" & [lngLinBD]).Value = xl07OutAtv.Range("U" & [lngLinBD] - 476).Value
             Range("AM" & [lngLinBD]).Value = xl07OutAtv.Range("V" & [lngLinBD] - 507).Value
             Range("AN" & [lngLinBD]).Value = xl07OutAtv.Range("V" & [lngLinBD] - 476).Value
             'GSOL00277827
             Range("AO" & [lngLinBD]).Value = xl07OutAtv.Range("W" & [lngLinBD] - 507).Value
             Range("AP" & [lngLinBD]).Value = xl07OutAtv.Range("W" & [lngLinBD] - 476).Value
             Range("AQ" & [lngLinBD]).Value = xl07OutAtv.Range("X" & [lngLinBD] - 507).Value
             Range("AR" & [lngLinBD]).Value = xl07OutAtv.Range("X" & [lngLinBD] - 476).Value
             Range("AS" & [lngLinBD]).Value = xl07OutAtv.Range("Y" & [lngLinBD] - 507).Value
             Range("AT" & [lngLinBD]).Value = xl07OutAtv.Range("Y" & [lngLinBD] - 476).Value
             Range("AU" & [lngLinBD]).Value = xl07OutAtv.Range("Z" & [lngLinBD] - 507).Value
             Range("AV" & [lngLinBD]).Value = xl07OutAtv.Range("Z" & [lngLinBD] - 476).Value
             Range("AW" & [lngLinBD]).Value = xl07OutAtv.Range("AA" & [lngLinBD] - 507).Value
             Range("AX" & [lngLinBD]).Value = xl07OutAtv.Range("AA" & [lngLinBD] - 476).Value
             Range("AY" & [lngLinBD]).Value = xl07OutAtv.Range("AB" & [lngLinBD] - 507).Value
             Range("AZ" & [lngLinBD]).Value = xl07OutAtv.Range("AB" & [lngLinBD] - 476).Value
             Range("BA" & [lngLinBD]).Value = xl07OutAtv.Range("AC" & [lngLinBD] - 507).Value
             Range("BB" & [lngLinBD]).Value = xl07OutAtv.Range("AC" & [lngLinBD] - 476).Value
             Range("BC" & [lngLinBD]).Value = xl07OutAtv.Range("AD" & [lngLinBD] - 507).Value
             Range("BD" & [lngLinBD]).Value = xl07OutAtv.Range("AD" & [lngLinBD] - 476).Value
             Range("BE" & [lngLinBD]).Value = xl07OutAtv.Range("AE" & [lngLinBD] - 507).Value
             Range("BF" & [lngLinBD]).Value = xl07OutAtv.Range("AE" & [lngLinBD] - 476).Value
             Range("BG" & [lngLinBD]).Value = xl07OutAtv.Range("AF" & [lngLinBD] - 507).Value
             Range("BH" & [lngLinBD]).Value = xl07OutAtv.Range("AF" & [lngLinBD] - 476).Value
             Range("BI" & [lngLinBD]).Value = xl07OutAtv.Range("AG" & [lngLinBD] - 507).Value
             Range("BJ" & [lngLinBD]).Value = xl07OutAtv.Range("AG" & [lngLinBD] - 476).Value
             Range("BK" & [lngLinBD]).Value = xl07OutAtv.Range("AH" & [lngLinBD] - 507).Value
             Range("BL" & [lngLinBD]).Value = xl07OutAtv.Range("AH" & [lngLinBD] - 476).Value
             Range("BM" & [lngLinBD]).Value = xl07OutAtv.Range("AI" & [lngLinBD] - 507).Value
             Range("BN" & [lngLinBD]).Value = xl07OutAtv.Range("AI" & [lngLinBD] - 476).Value
             Range("BO" & [lngLinBD]).Value = xl07OutAtv.Range("AJ" & [lngLinBD] - 507).Value
             Range("BP" & [lngLinBD]).Value = xl07OutAtv.Range("AJ" & [lngLinBD] - 476).Value
             
         Next lngLinBD
         
         Range("G540").Value = xl07OutAtv.Range("F70").Value
         For lngLinBD = 541 To 546
             Range("E" & [lngLinBD]).Value = xl07OutAtv.Range("D" & [lngLinBD] - 464).Value
             Range("H" & [lngLinBD]).Value = xl07OutAtv.Range("F" & [lngLinBD] - 464).Value
         Next lngLinBD

         For lngLinBD = 801 To 810  'Atividades Econômicas
             Range("E" & [lngLinBD]).Value = xl07OutAtv.Range("D" & [lngLinBD] - 708).Value
             Range("F" & [lngLinBD]).Value = xl07OutAtv.Range("E" & [lngLinBD] - 708).Value
         Next lngLinBD

         ExportaProjetoOutraAtiv = 1
         'Sprint 11 04/2017 - Permitir utilizar a área de transferência    ,
         Boorel = False
         Exit Function

erroExportaProjetoOutraAtiv:
         Boorel = False
         ExportaProjetoOutraAtiv = -1
End Function

Function ExportaProjetoBaseFin() As Integer
         Dim lngLinBD As Long
         On Error GoTo erroExportaProjetoBaseFin
         
         Boorel = True
         
         xl00Dados.Activate
         Range("E722").Select
         Range("E722").Value = xl09CalcFinanc.Range("D13").Value
         Range("F722").Value = xl09CalcFinanc.Range("D14").Value
         Range("G722").Value = xl09CalcFinanc.Range("D15").Value
         Range("H722").Value = xl09CalcFinanc.Range("D16").Value
         Range("I722").Value = xl09CalcFinanc.Range("D17").Value
         
         Range("E723").Value = xl09CalcFinanc.Range("DD13").Value
         Range("F723").Value = xl09CalcFinanc.Range("DD14").Value
         Range("G723").Value = xl09CalcFinanc.Range("DD15").Value
         Range("H723").Value = xl09CalcFinanc.Range("DD16").Value
         Range("I723").Value = xl09CalcFinanc.Range("DD17").Value
                  
         '- valores para amortizações diferentes
         For lngLinBD = 722 To 745
             Range("M" & [lngLinBD]).Value = xl09CalcFinanc.Range("N" & [lngLinBD] - 710).Value
             Range("N" & [lngLinBD]).Value = xl09CalcFinanc.Range("DN" & [lngLinBD] - 710).Value
         Next lngLinBD
         
         ExportaProjetoBaseFin = 1
         Boorel = False
         Exit Function

erroExportaProjetoBaseFin:
         Boorel = False
         ExportaProjetoBaseFin = -1
End Function

'SICOR  12/07/2022 RNM FIM
Function ImportaProjetoSicor(xlPronaf As String)
Dim li_dados, li_sicor, li_total, li_seq As Integer
Dim ls_descr_inv, ls_cabecalho As String
Dim ldb_perc_en_ren As Double
Dim protPlan As clsProtecao
Dim ll_linha, ll_salto, ll_salto_indice, ll_linha_v As Long
Set protPlan = New clsProtecao
protPlan.IniciaRotina False

Workbooks([xlPronaf]).Sheets("SICOR").Unprotect Password:="senhasBNxl"


'LIMPAR ABA SICOR ANTES DA IMPORTAÇÃO DE NOVO PROJETO. 23/09/2021 INICIO
'CÓDIGO QUE LIMPA CADA INVERSÃO, PRIMEIRO O PERCENTUAL DE ENERGIA RENOVAVEL, DEPOIS AS DESCRIÇÕES POR LINHA. SÃO 4 DESCRIÇÕES POR LINHA
'MANTENDO CUIDADO PARA NÃO APAGAR DADOS QUE NÃO DEVEM COMO CABEÇALHOS. 23/09/2021

'LIMPAR ABA SICOR ANTES DA IMPORTAÇÃO DE NOVO PROJETO. 23/09/2021 FINAL
'Limpar percentual de energia renovavel
ll_salto = 5 'Inicio do percentual de energia renovável
For li_linha = 1 To 36
    xlSicor.Range("E" & ll_salto).ClearContents
    ll_salto = ll_salto + 24
Next
'limpar descrições da inversão (20 linhas de cada)

'limpar descrições por inversão INICIO
ll_salto_indice = 7 'Inicio das descrições
For li_linha_v = 1 To 36 'apagar até essa linha
    xlSicor.Range("C" & Trim(Str(ll_salto_indice)) & ":D" + Trim(Str(ll_salto_indice + 19))).ClearContents
    xlSicor.Range("E" & Trim(Str(ll_salto_indice)) & ":F" + Trim(Str(ll_salto_indice + 19))).ClearContents
    xlSicor.Range("G" & Trim(Str(ll_salto_indice)) & ":H" + Trim(Str(ll_salto_indice + 19))).ClearContents
    xlSicor.Range("I" & Trim(Str(ll_salto_indice)) & ":J" + Trim(Str(ll_salto_indice + 19))).ClearContents
    ll_salto_indice = ll_salto_indice + 24
Next
'limpar descrições por inversão FINAL


'**************************  TENHO QUE GRAVAR AINDA AS DISCRIMINAÇÃO NA ABA PROPOSTA DA LINHA A41 A A53. DIA 13/07/2021 **************************************-
'li_inv = Array(7, 31, 55, 79, 103, 127, 151, 175, 199, 223, 247, 271, 295, 319, 343, 367, 391, 415, 439, 463, 487, 511, 535, 559, 583, 607, 631, 655, 679, 703, 727, 751, 775, 799, 823, 847)
li_total = 1
li_dados = 2002
ls_cabecalho = Range("E2000")  'Caso projeto não tenha ainda os dados do SICOR, evitar importar, para não dar erro na importação
If Len(ls_cabecalho) = 0 Then Exit Function 'Não existe SICOR para importação.

'1002 seria o Inicio dos dados da aba DADOS do SICOR
'2000 seria o final dos dados da aba DADOS do SICOR caso tivesse todos os registros
'For li_dados = 1002 To 1262  ' Fazer 36 vezes. Varrer todas as linhs disponiveis. '4 to 871
Do While li_total <= 36 '36 é o correto
    'Verificar qual item de inversão para posicionar corretamente na aba SICOR
    li_seq = Range("E" & [li_dados]).Value ' Sequencia da Inversão
    ' Posicionar as informações corretamente na ABA SICOR com os dados que vem de importação
    If li_seq = 1 Then
       li_sicor = 7
    ElseIf li_seq = 2 Then
       li_sicor = 31
    ElseIf li_seq = 3 Then
      li_sicor = 55
    ElseIf li_seq = 4 Then
       li_sicor = 79
    ElseIf li_seq = 5 Then
       li_sicor = 103
    ElseIf li_seq = 6 Then
       li_sicor = 127
    ElseIf li_seq = 7 Then
       li_sicor = 151
    ElseIf li_seq = 8 Then
       li_sicor = 175
    ElseIf li_seq = 9 Then
       li_sicor = 199
    ElseIf li_seq = 10 Then
       li_sicor = 223
    ElseIf li_seq = 11 Then
       li_sicor = 247
    ElseIf li_seq = 12 Then
       li_sicor = 271
    ElseIf li_seq = 13 Then
       li_sicor = 295
    ElseIf li_seq = 14 Then
       li_sicor = 319
    ElseIf li_seq = 15 Then
       li_sicor = 343
    ElseIf li_seq = 16 Then
       li_sicor = 367
    ElseIf li_seq = 17 Then
       li_sicor = 391
    ElseIf li_seq = 18 Then
       li_sicor = 415
    ElseIf li_seq = 19 Then
       li_sicor = 439
    ElseIf li_seq = 20 Then
       li_sicor = 463
    ElseIf li_seq = 21 Then
       li_sicor = 487
    ElseIf li_seq = 22 Then
       li_sicor = 511
    ElseIf li_seq = 23 Then
       li_sicor = 535
    ElseIf li_seq = 24 Then
       li_sicor = 559
    ElseIf li_seq = 25 Then
       li_sicor = 583
    ElseIf li_seq = 26 Then
       li_sicor = 607
    ElseIf li_seq = 27 Then
       li_sicor = 631
    ElseIf li_seq = 28 Then
       li_sicor = 655
    ElseIf li_seq = 29 Then
       li_sicor = 679
    ElseIf li_seq = 30 Then
       li_sicor = 703
    ElseIf li_seq = 31 Then
       li_sicor = 727
    ElseIf li_seq = 32 Then
       li_sicor = 751
    ElseIf li_seq = 33 Then
       li_sicor = 775
    ElseIf li_seq = 34 Then
       li_sicor = 799
    ElseIf li_seq = 35 Then
       li_sicor = 823
    ElseIf li_seq = 36 Then
       li_sicor = 847
    End If
    'Gravar dados da Discriminação
     Workbooks([xlPronaf]).Sheets("SICOR").Range("E" & [li_sicor] - 2).Value = Range("K" & [li_dados]).Value ' Percentual de Energia Renovável
    'Varrer itens de das 13 inversões ate o final
    For li_linha = 1 To 20 'varrer os 20 itens caso tenha dados
        'Workbooks([xlInvestRur]).Sheets("SICOR").Range("B" & [li_sicor]).Value = Range("A" & [li_dados]).Value                   'Sequencia
        Workbooks([xlPronaf]).Sheets("SICOR").Range("C" & [li_sicor]).NumberFormat = "@"
        Workbooks([xlPronaf]).Sheets("SICOR").Range("C" & [li_sicor]).Value = Range("G" & [li_dados]).Value                   'Código de Certificação Orgânica
        Workbooks([xlPronaf]).Sheets("SICOR").Range("E" & [li_sicor]).NumberFormat = "@"
        Workbooks([xlPronaf]).Sheets("SICOR").Range("E" & [li_sicor]).Value = Range("H" & [li_dados]).Value                   'URL da Certificação Organica
        Workbooks([xlPronaf]).Sheets("SICOR").Range("G" & [li_sicor]).NumberFormat = "@"
        Workbooks([xlPronaf]).Sheets("SICOR").Range("G" & [li_sicor]).Value = Range("I" & [li_dados]).Value                   'Código de Rastreabilidade
        Workbooks([xlPronaf]).Sheets("SICOR").Range("I" & [li_sicor]).NumberFormat = "@"
        Workbooks([xlPronaf]).Sheets("SICOR").Range("I" & [li_sicor]).Value = Range("J" & [li_dados]).Value                   'URL da Certificação de Rastreabilidade
        li_dados = li_dados + 1
        li_sicor = li_sicor + 1
        If Range("E" & [li_dados]).Value = "" Then                  'Sequencia SAIR SE TIVER BRANCO
           li_total = 36
           Exit For
        End If
    Next
    li_total = li_total + 1 'Fazer até a 36a. Inversão
'Next
Loop

protPlan.FinalizaRotina
xlSicor.Protect Password:="senhasBNxl"
'SICOR  12/07/2022 RNM FIM final
End Function
'
Sub ImportaProjeto()
' JORIS BANE - VERIFICR - 31.03

    
    Dim xlInvRural As String, strFiltro As String, xlArquivo As String
    Dim flagArquivo As Boolean
    Dim xlArqImp, xlPlan
    Dim sb As clsProgressBar
    Dim dtVersaoAtual As Date, dtVersaoArquivo As Date
    Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao
    Set sb = New clsProgressBar
    sb.Show "Importando os dados ", vbNullString, 1
    
    Boorel = True
    
    xl00Menu.Activate
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    
    xlInvRural = ActiveWorkbook.Name
    strFiltro = "Arquivo de dados Planilha PRONAF A2(*.pronaf_a2),*.pronaf_a2"
                    '& _
                '"Arquivo de dados Planilha PRONAF-C/D (*.pronaf_c;*.xls),*.pronaf_c;*.xls,"
    xlArqImp = Application.GetOpenFilename(strFiltro, , ":: Importar Plano PRONAF-A Versão 2.0")
    If xlArqImp = False Then
       Set sb = Nothing
       Set protPlan = Nothing
       Exit Sub
    End If
    If UCase(Right(xlArqImp, 4)) = ".XLS" Then
       Proj_Importa (xlArqImp)
       Set sb = Nothing
       Set protPlan = Nothing
       Exit Sub
    End If

    protPlan.IniciaRotina False
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    Workbooks.Open xlArqImp, Password:="senhasBN"
    'Congelar a tela para ser mais rápido
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    xlArquivo = ActiveWorkbook.Name
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    Sheets("BdPRONAF_C").Activate
    If Err Then
       MsgBox "Arquivo inválido", vbExclamation
       Set sb = Nothing
       Set protPlan = Nothing
       Exit Sub
    End If
    If Range("A4").Value = vbNullString Then
       Range("A4").Value = "31/12/2005"
    End If
    On Error GoTo erroImportaProjeto
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    sb.Show "Importando os dados ", vbNullString, 5
    dtVersaoAtual = CDate(Right(xl00Menu.Range("B24").Value, 10))
    sb.Show "Importando os dados", vbNullString, 8
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    If ImportaProjetoVersaoAnterior(xlInvRural, xlArquivo, dtVersaoAtual) = -1 Then GoTo erroImportaProjeto
'---- Cliente
    sb.Show "Importando os dados", "...Cliente", 10
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    If checarVersaoPlanilha("A4") < CDate("19/06/2008") Then
       If ImportaProjetoClienteOld(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
    Else
       If ImportaProjetoCliente(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
    End If
    
'---- Avaliação
    sb.Show "Importando os dados", "...Avaliação", 20
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    If ImportaProjetoAvaliacao(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
'---- Proposta
    sb.Show "Importando os dados", "...Proposta ", 30
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    If ImportaProjetoProposta(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
'---- Cronograma e complementos
    sb.Show "Importando os dados", "...Cronograma ", 40
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    If ImportaProjetoCronograma(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
'---- Coordenada Geodesica ----
' RTC 1207004
'    sb.Show "Importando os dados", "...Coordenadas Geodésicas", 45
'    CarregamentoRapido True
'    If ImportaProjetoCoordGeodesicas(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto      'GSOL00969220 - RNM INI
'---- Atividade Agricola ----
    sb.Show "Importando os dados", "...Atividade Agrícola", 50
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    'Sprint 11 04/2017 - Ajuste de importação de atividade agricola
    'If checarVersaoPlanilha("A4") < CDate("30/11/2005") Then
    '   If ImportaProjetoAtivAgricolaOld(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
    'Else
    If ImportaProjetoAtivAgricola(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
    'End If
'---- Atividade Pecuária ----
    sb.Show "Importando os dados", "...Atividade Pecuária", 60
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    If ImportaProjetoAtivPecuaria(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
'---- Planilha Sicor ---- 18/08/2021
    sb.Show "Importando os dados", "..Dados SICOR...", 65
    CarregamentoRapido True
    If ImportaProjetoSicor(xlInvRural) = -1 Then GoTo erroImportaProjeto
    
'---- Outras Atividades
    sb.Show "Importando os dados", "...Outras Atividades", 70
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    If ImportaProjetoOutraAtiv(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
'---- Planilha Financiamento ----
    sb.Show "Importando os dados", "...Bases do Financiamento", 90
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    If ImportaProjetoBaseFin(xlInvRural, xlArquivo) = -1 Then GoTo erroImportaProjeto
    
    Workbooks([xlArquivo]).Activate
    sb.Show "Importando os dados ", "...Concluíndo", 92
    ActiveWorkbook.Close SaveChanges:=False
    Workbooks([xlInvRural]).Activate
    xl00Menu.Activate
    'Congelar a tela para ser mais rápido
    CarregamentoRapido True ' D000347 - 25/09/14 - GSOL00822671
    xl00Menu.Activate
    sb.Show "Importando os dados ", "...Atualizando guias", 95
    Application.ScreenUpdating = False
    AtualizaTelas
    'Sprint 11 04/2017 - Calculo financeiro
    Sheets("CalculoFinanceiro").Range("D12").Calculate
    If Sheets("CalculoFinanceiro").Range("D12").Value <= 0 Then
      Sheets("CalculoFinanceiro").Range("D13").Value = ""
      Sheets("CalculoFinanceiro").Range("D14").Value = ""
      Sheets("CalculoFinanceiro").Range("D15").Value = ""
    End If
    Sheets("CalculoFinanceiro").Range("DD12").Calculate
    If Sheets("CalculoFinanceiro").Range("DD12").Value <= 0 Then
      Sheets("CalculoFinanceiro").Range("DD13").Value = ""
      Sheets("CalculoFinanceiro").Range("DD14").Value = ""
      Sheets("CalculoFinanceiro").Range("DD15").Value = ""
    End If
    'Sprint 11 04/2017 - Calculo financeiro
    
    'Sprint 11 04/2017 - Atualização progresso
    sb.Show "Importando os dados ", "...Atualizando guias", 98
    
' RTC 1207004
'    CarregamentoRapido True
'    bd10Geodesica.Activate
'    CargaIniGeodesica
    
    'Sprint 14 RNM INI Controle de Operações Rurais
'     xl02Aval.Activate
'     protPlan.DesprotegePlanilha
'     Range("E295").Value = "NIRF"
'     'Range("H295").Value = "CEI" MUDOU PARA ABAIXO. DIA 28/09/2021
'     Range("G295").Value = "CEI"
'     'Range("J295").Value = "SNCR" MUDOU PARA ABAIXO. DIA 28/09/2021
'     Range("I295").Value = "SNCR"
'     'Range("L295").Value = "Registro CAR" MUDOU PARA ABAIXO. DIA 28/09/2021
'     Range("J295").Value = "Registro CAR"
'     Range("L295").Valeu = "Número de Outorga de Água da Propriedade" 'Numero de Outorga RTC 600512 28/09/2021
'     Range("M295").Valeu = "Percentual de Preservação da Propriedade Acima do Limite Legal" 'Percentual de Energia Ren. RTC 600512 28/09/2021
'     protPlan.ProtegePlanilha
    'Sprint 14 RNM INI Controle de Operações Rurais
    
    xl00Menu.Activate
    sb.Show "Importando os dados ", "...Processo concluído", 100
    protPlan.FinalizaRotina
    Application.EnableCancelKey = xlInterrupt
    'Congelar a tela para ser mais rápido
    CarregamentoRapido False
    xl00Menu.Activate
   
    MsgBox "Projeto do cliente " & xl01Cliente.Range("E13").Value & " importado"
    'Congelar a tela para ser mais rápido
    
     ' 03.07.2026 - chama macro para formatar CNPJ
    ' Joris Bane
        Call FormataCelula
    'Call FormataCelulasCpfCnpj
    
  '  MsgBox ("Formatar CNPJ e CPF")
    ' FIM DE ROTINA
    
    
    Application.ScreenUpdating = False
    xl00Menu.Activate
    Set sb = Nothing
    Set protPlan = Nothing
    VerCriticaProjeto 1
    
    CarregamentoRapido False ' Retornando ao normal
    Exit Sub
    
    
    
    
    
erroImportaProjeto:
    Resume Next
    Application.StatusBar = "..."
    MsgBox "Ocorreu um erro durante o processo" & vbCrLf & Err.Description
    Workbooks([xlArquivo]).Close (False)
    Workbooks([xlInvRural]).Activate
    
    'Sprint 11 04/2017 - Permitir utilizar a área de transferência
    Boorel = False
    
    xl00Menu.Activate
    Application.EnableCancelKey = xlInterrupt
    protPlan.FinalizaRotina
    Set protPlan = Nothing
    CarregamentoRapido False ' Retornando ao normal
    Exit Sub

End Sub

Function ImportaProjetoCliente(xlArq As String, xlArqBD As String) As Integer
         Dim lngColCelFim As Long, lngLinCel As Long
         Dim lngColCel As Long
         On Error GoTo erroImportaProjetoCliente
          
         Application.ScreenUpdating = False
         lngColCelFim = 114
         lngLinCel = 12
         Workbooks([xlArqBD]).Activate
         Range("E12").Select
         Workbooks([xlArq]).Sheets("Cliente").Unprotect Password:="senhasBNxl"
         While ActiveCell.Column <= lngColCelFim
       
               Workbooks([xlArq]).Sheets("Cliente").Cells(lngLinCel, 5).Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
               
               If ActiveCell.Column = 24 Then
                  If IsNumeric(Range("X12").Value) Then
                     lngLinCel = lngLinCel + 6
                  End If
               End If
               
               If ActiveCell.Column = 25 Then
                  If IsNumeric(Range("X12").Value) Then
                     lngLinCel = lngLinCel - 6
                  End If
               End If
               
               If ActiveCell.Column = 30 Then
                  If ActiveCell.Value = vbNullString Then
                     lngLinCel = lngLinCel + 1
                  End If
               End If
               
               If ActiveCell.Column = 31 Then
                  If Range("AD12").Value = vbNullString Then
                     lngLinCel = lngLinCel - 1
                  End If
               End If
               
               If ActiveCell.Column = 27 Then
                  lngLinCel = lngLinCel + 1
                  ActiveCell.Offset(0, 1).Select
               End If
               If ActiveCell.Column = 35 Then
                  lngLinCel = lngLinCel + 2
               End If
                If ActiveCell.Column = 47 Then
                  lngLinCel = lngLinCel + 2
                  ActiveCell.Offset(0, 1).Select
                End If
               If ActiveCell.Column = 57 Then
                    lngLinCel = lngLinCel + 6
                    ActiveCell.Offset(0, 2).Select
               End If
               If ActiveCell.Column = 62 Then
                    lngLinCel = lngLinCel + 1
                    ActiveCell.Offset(0, 1).Select
               End If
               If ActiveCell.Column = 64 Then
                    lngLinCel = lngLinCel + 4
               End If
               If ActiveCell.Column = 83 Then
                    lngLinCel = lngLinCel + 5
               End If
         Wend
         
         ImportaProjetoCliente = 1
         Workbooks([xlArq]).Sheets("Cliente").Protect Password:="senhasBNxl"
         Exit Function

erroImportaProjetoCliente:
         ImportaProjetoCliente = -1

End Function
Function ImportaProjetoClienteOld(xlArq As String, xlArqBD As String) As Integer
         Dim lngColCelFim As Long, lngLinCel As Long
         Dim lngColCel As Long
         On Error GoTo erroImportaProjetoCliente
         'Congelar a tela para ser mais rápido
         Application.ScreenUpdating = False
         lngColCelFim = 100
         lngLinCel = 12
         
         Workbooks([xlArqBD]).Activate
         Range("E12").Select
         
         Workbooks([xlArq]).Sheets("Cliente").Range("E12").Value = Cells(12, "E").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E13").Value = Cells(12, "F").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E14").Value = Cells(12, "G").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E15").Value = Cells(12, "H").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E16").Value = Cells(12, "J").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E17").Value = Cells(12, "K").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E18").Value = Cells(12, "L").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E20").Value = Cells(12, "M").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E21").Value = Cells(12, "N").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E22").Value = Cells(12, "O").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E23").Value = Cells(12, "Q").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E24").Value = Cells(12, "P").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E25").Value = Cells(12, "R").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E26").Value = Cells(12, "S").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E27").Value = Cells(12, "T").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E28").Value = Cells(12, "U").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E29").Value = Cells(12, "V").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E30").Value = Cells(12, "W").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E31").Value = Cells(12, "X").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E32").Value = Cells(12, "AO").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E33").Value = Cells(12, "AP").Value
         
         Workbooks([xlArq]).Sheets("Cliente").Range("E45").Value = Cells(12, "AF").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E46").Value = Cells(12, "AG").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E47").Value = Cells(12, "AH").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E48").Value = Cells(12, "AI").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E49").Value = Cells(12, "AJ").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E50").Value = Cells(12, "AK").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E51").Value = Cells(12, "AM").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E52").Value = Cells(12, "AN").Value
         
         Workbooks([xlArq]).Sheets("Cliente").Range("E73").Value = Cells(12, "AS").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E74").Value = Cells(12, "AT").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E75").Value = Cells(12, "AU").Value
         Workbooks([xlArq]).Sheets("Cliente").Range("E77").Value = Cells(12, "AW").Value
         
         
         Range("AX12").Select
         lngLinCel = 82
         While ActiveCell.Column <= lngColCelFim
               Workbooks([xlArq]).Sheets("Cliente").Cells(lngLinCel, 5).Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
               
               If lngLinCel = 98 Then
                    lngLinCel = 106
                    ActiveCell.Offset(0, 3).Select
               End If
         Wend
         
         ImportaProjetoClienteOld = 1
         Exit Function

erroImportaProjetoCliente:
         ImportaProjetoClienteOld = -1

End Function
Function ImportaProjetoAvaliacao(xlArq As String, xlArqBD As String) As Integer
         Dim lngLinCel As Long
         On Error GoTo erroImportaProjetoAvaliacao
         'Congelar a tela para ser mais rápido
         Application.ScreenUpdating = False
         
         Workbooks([xlArqBD]).Activate
         Workbooks([xlArq]).Sheets("Avaliação").Unprotect Password:="senhasBNxl"
         Range("E22").Select
         For lngLinCel = 22 To 24  'Imoveis vinculados ao plano
             Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] - 15).Value = Range("E" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] - 15).Value = Range("F" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("K" & [lngLinCel] - 15).Value = Range("G" & [lngLinCel]).Value  'GSOL01924692 - INI NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018 de L PARA K
             Workbooks([xlArq]).Sheets("Avaliação").Range("L" & [lngLinCel] - 15).Value = Range("H" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("M" & [lngLinCel] - 15).Value = Range("I" & [lngLinCel]).Value
         Next lngLinCel
         Workbooks([xlArq]).Sheets("Avaliação").Range("J43").Value = Range("J22").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("D10").Value = Range("K22").Value
         For lngLinCel = 22 To 45  'Imovel 1: Terras e Coberturas
             If lngLinCel <> 32 And _
                lngLinCel <> 43 And _
                lngLinCel <> 44 And _
                lngLinCel <> 45 Then Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] - 5).Value = Range("N" & [lngLinCel]).Value
             If lngLinCel <> 32 Then Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] - 5).Value = Range("O" & [lngLinCel]).Value
             If lngLinCel <> 45 And _
                lngLinCel <> 32 Then
                Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] - 5).Value = Range("P" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets("Avaliação").Range("J" & [lngLinCel] - 5).Value = Range("Q" & [lngLinCel]).Value
             End If
         Next lngLinCel
         For lngLinCel = 22 To 41  'Imovel 1: Edificações/Instalações
             Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 27).Value = Range("T" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 27).Value = Range("U" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 27).Value = Range("V" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] + 27).Value = Range("W" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("K" & [lngLinCel] + 27).Value = Range("X" & [lngLinCel]).Value
         Next lngLinCel
         
         Workbooks([xlArq]).Sheets("Avaliação").Range("J103").Value = Range("J23").Value
         For lngLinCel = 46 To 69  'Imovel 2: Terras e Coberturas
             If lngLinCel <> 56 And _
                lngLinCel <> 67 And _
                lngLinCel <> 68 And _
                lngLinCel <> 69 Then Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 31).Value = Range("N" & [lngLinCel]).Value
             If lngLinCel <> 56 Then Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 31).Value = Range("O" & [lngLinCel]).Value
             If lngLinCel <> 56 And _
                lngLinCel <> 69 Then
                Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 31).Value = Range("P" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets("Avaliação").Range("J" & [lngLinCel] + 31).Value = Range("Q" & [lngLinCel]).Value
             End If
         Next lngLinCel
         For lngLinCel = 42 To 61 'Imovel 2: Edificações/Instalações
             Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 67).Value = Range("T" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 67).Value = Range("U" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 67).Value = Range("V" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] + 67).Value = Range("W" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("K" & [lngLinCel] + 67).Value = Range("X" & [lngLinCel]).Value
         Next lngLinCel
         Workbooks([xlArq]).Sheets("Avaliação").Range("J163").Value = Range("J24").Value
         For lngLinCel = 70 To 93  'Imovel 3: Terras e Coberturas
             If lngLinCel <> 80 And _
                lngLinCel <> 91 And _
                lngLinCel <> 92 And _
                lngLinCel <> 93 Then Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 67).Value = Range("N" & [lngLinCel]).Value
             If lngLinCel <> 80 Then Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 67).Value = Range("O" & [lngLinCel]).Value
             If lngLinCel <> 80 And _
                lngLinCel <> 93 Then
                Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 67).Value = Range("P" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets("Avaliação").Range("J" & [lngLinCel] + 67).Value = Range("Q" & [lngLinCel]).Value
             End If
         Next lngLinCel
         For lngLinCel = 64 To 83 'Imovel 3: Edificações/Instalações
             Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 105).Value = Range("T" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 105).Value = Range("U" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 105).Value = Range("V" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] + 105).Value = Range("W" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("K" & [lngLinCel] + 105).Value = Range("X" & [lngLinCel]).Value
         Next lngLinCel
         For lngLinCel = 22 To 31  'Maquinas / Equipamentos
             Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 171).Value = Range("AA" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 171).Value = Range("AB" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 171).Value = Range("AC" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] + 171).Value = Range("AD" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("K" & [lngLinCel] + 171).Value = Range("AE" & [lngLinCel]).Value
         Next lngLinCel
         For lngLinCel = 22 To 31  'Implementos / Veiculos
             Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 185).Value = Range("AH" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 185).Value = Range("AI" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 185).Value = Range("AJ" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] + 185).Value = Range("AK" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("K" & [lngLinCel] + 185).Value = Range("AL" & [lngLinCel]).Value
         Next lngLinCel
         For lngLinCel = 22 To 31  'Móveis e Utensilios
             Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 199).Value = Range("AO" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 199).Value = Range("AP" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 199).Value = Range("AQ" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] + 199).Value = Range("AR" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("K" & [lngLinCel] + 199).Value = Range("AS" & [lngLinCel]).Value
         Next lngLinCel
         '- Indicadores Semoventes
         Workbooks([xlArq]).Sheets("Avaliação").Range("A244").Value = Range("AV22").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A245").Value = Range("AW22").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A253").Value = Range("AV23").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A254").Value = Range("AW23").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A262").Value = Range("AV24").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A263").Value = Range("AW24").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A269").Value = Range("AV25").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A270").Value = Range("AW25").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A276").Value = Range("AV26").Value
         Workbooks([xlArq]).Sheets("Avaliação").Range("A277").Value = Range("AW26").Value
         For lngLinCel = 23 To 67  'Semoventes
             If lngLinCel <> 31 And _
                lngLinCel <> 40 And _
                lngLinCel <> 47 And _
                lngLinCel <> 54 Then
                If lngLinCel > 54 Then _
                   Workbooks([xlArq]).Sheets("Avaliação").Range("D" & [lngLinCel] + 222).Value = Range("AX" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 222).Value = Range("AY" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 222).Value = Range("AZ" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets("Avaliação").Range("J" & [lngLinCel] + 222).Value = Range("BA" & [lngLinCel]).Value
             End If
         Next lngLinCel
         
         For lngLinCel = 22 To 24  ' Imóveis Vinculados ao Plano
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 274).Value = Range("BD" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 274).Value = Range("BE" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] + 274).Value = Range("BF" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("J" & [lngLinCel] + 274).Value = Range("BG" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("L" & [lngLinCel] + 274).Value = Range("BK" & [lngLinCel]).Value 'Número de Outorga de Água da Propriedade 18/08/2021 600512
             Workbooks([xlArq]).Sheets("Avaliação").Range("M" & [lngLinCel] + 274).Value = Range("BL" & [lngLinCel]).Value 'Percentual de Preservação da Propriedade Acima do Limite Legal 18/08/2021 600512
             Workbooks([xlArq]).Sheets("Avaliação").Range("E" & [lngLinCel] + 280).Value = Range("BM" & [lngLinCel]).Value 'S033 [1004790] -PLANILHAS - INCLUSÃO DE CAMPOS PARA OS IMÓVEIS - CATÁLOGO 5.08 - PRONAF
             Workbooks([xlArq]).Sheets("Avaliação").Range("G" & [lngLinCel] + 280).Value = Range("BN" & [lngLinCel]).Value 'S033 [1004790] -PLANILHAS - INCLUSÃO DE CAMPOS PARA OS IMÓVEIS - CATÁLOGO 5.08 - PRONAF
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] + 280).Value = Range("BO" & [lngLinCel]).Value 'S033 [1004790] -PLANILHAS - INCLUSÃO DE CAMPOS PARA OS IMÓVEIS - CATÁLOGO 5.08 - PRONAF
             Workbooks([xlArq]).Sheets("Avaliação").Range("J" & [lngLinCel] + 280).Value = Range("BP" & [lngLinCel]).Value 'S033 [1004790] -PLANILHAS - INCLUSÃO DE CAMPOS PARA OS IMÓVEIS - CATÁLOGO 5.08 - PRONAF

         Next lngLinCel
                  
        'GSOL01924692 - INI NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018 Nome do Proprietário e CPF
         For lngLinCel = 22 To 24  'Nome do Proprietário e CPF
             Workbooks([xlArq]).Sheets("Avaliação").Range("H" & [lngLinCel] - 15).Value = Range("BH" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("I" & [lngLinCel] - 15).Value = Range("BI" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets("Avaliação").Range("J" & [lngLinCel] - 15).Value = Range("BJ" & [lngLinCel]).Value
         Next lngLinCel
         'GSOL01924692 - FIM NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018 Nome do Proprietário e CPF
         
         Workbooks([xlArq]).Sheets("Avaliação").Protect Password:="senhasBNxl"
         ImportaProjetoAvaliacao = 1
         Exit Function

erroImportaProjetoAvaliacao:
         Workbooks([xlArq]).Sheets("Avaliação").Protect Password:="senhasBNxl"
         ImportaProjetoAvaliacao = -1
End Function

Function ImportaProjetoProposta(xlArq As String, xlArqBD As String) As Integer
         Dim lngColCelFim As Long, lngLinCel As Long
         Dim lngColCel As Long
         Dim dtVersaoAtual As Date
         On Error GoTo erroImportaProjetoProposta
         'Congelar a tela para ser mais rápido
         Application.ScreenUpdating = False
         'GSOL00921471 - RNM CAMPO REATIVADO EM 06/2015 ALTERA PARA 17  'Inclusão do item Município Com Decreto de Emergência (S/N) alterar de 16 para 17 GSOL00800821 - RNM INI
         'GSOL00921471 - RNM CAMPO REATIVADO EM 06/2015 ALTERAR PARA 17  ' RNM RETIRADA DECRETO DE EMERGENCIA EM 02/2015 GSOL00878462 VOLTAR AO 16
         lngColCelFim = 21
         lngLinCel = 5
         dtVersaoAtual = CDate(Workbooks([xlArq]).Sheets("SEAP").Range("D2").Value)
         
         Workbooks([xlArqBD]).Activate
         Range("E122").Select
         While ActiveCell.Column <= lngColCelFim 'Dados iniciais
               If lngLinCel = 16 Then
                  Workbooks([xlArq]).Sheets(" Proposta").Cells(5, 10).Value = ActiveCell.Value
               ElseIf lngLinCel = 17 Then   'GSOL00921471 - RNM CAMPO REATIVADO EM 06/2015 ALTERA PARA 17  'Inclusão do item Município Com Decreto de Emergência (S/N) GSOL00800821 - RNM INI ' RNM RETIRADA DECRETO DE EMERGENCIA EM 02/2015 GSOL00878462
                  Workbooks([xlArq]).Sheets(" Proposta").Cells(9, 16).Value = ActiveCell.Value                                  ' RNM RETIRADA DECRETO DE EMERGENCIA EM 02/2015 GSOL00878462
               
               ElseIf lngLinCel = 18 Then   '
                  Workbooks([xlArq]).Sheets(" Proposta").Cells(12, 16).Value = ActiveCell.Value
                  
               ElseIf lngLinCel = 21 Then   '
                  Workbooks([xlArq]).Sheets(" Proposta").Cells(13, 16).Value = ActiveCell.Value
                                         
               ElseIf lngLinCel < 16 Then
                  Workbooks([xlArq]).Sheets(" Proposta").Cells(lngLinCel, 5).Value = ActiveCell.Value
               End If
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         
'        'GSOL00921471 - PLANO SAFRA - CORREÇÃO DA ALTERAÇÃO DE NOME DO PROGRAMA E FINALIDADE.
'         Workbooks([xlArq]).Sheets(" Proposta").Range("AN6").Calculate
'         If Workbooks([xlArq]).Sheets(" Proposta").Range("AN6").Value <> "" Then
'            Workbooks([xlArq]).Sheets(" Proposta").Range("E6").Value = Workbooks([xlArq]).Sheets(" Proposta").Range("AN6").Value
'         End If
'
'         Workbooks([xlArq]).Sheets(" Proposta").Range("T10").Calculate
'         If Workbooks([xlArq]).Sheets(" Proposta").Range("T10").Value <> "" Then
'            Workbooks([xlArq]).Sheets(" Proposta").Range("E10").Value = Workbooks([xlArq]).Sheets(" Proposta").Range("T10").Value
'         End If
'        'GSOL00921471 - PLANO SAFRA - CORREÇÃO DA ALTERAÇÃO DE NOME DO PROGRAMA E FINALIDADE.
        
        'Declaração de Ano de Renegociação GSOL00435468
             
            Workbooks([xlArq]).Sheets(" Proposta").Range("P185").Value = Range("I2").Value
            Workbooks([xlArq]).Sheets(" Proposta").Range("D71").Value = Range("I1").Value
            Workbooks([xlArq]).Sheets(" Proposta").Range("AN184").Value = Range("J1").Value
        
        'Declaração de Pessoas Politicamente Expostas
             Workbooks([xlArq]).Sheets(" Proposta").Range("AN189").Value = Range("J2").Value
         
         For lngLinCel = 122 To 157 'Inversões
             Workbooks([xlArq]).Sheets(" Proposta").Range("D" & [lngLinCel] - 95).Value = Range("W" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("E" & [lngLinCel] - 95).Value = Range("X" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("F" & [lngLinCel] - 95).Value = Range("Y" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("G" & [lngLinCel] - 95).Value = Range("Z" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("H" & [lngLinCel] - 95).Value = Range("AA" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("J" & [lngLinCel] - 95).Value = Range("AB" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("I" & [lngLinCel] - 95).Value = Range("AC" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("L" & [lngLinCel] - 95).Value = Range("AD" & [lngLinCel]).Value
         Next lngLinCel
         
         Workbooks([xlArq]).Sheets(" Proposta").Range("J64").Value = Range("AB158").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("L64").Value = Range("AD158").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("J65").Value = Range("AB159").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("L65").Value = Range("AD159").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("H69").Value = Range("AA160").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("L69").Value = Range("AD160").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("D22").Value = Range("S122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("H22").Value = Range("T122").Value
        
         Workbooks([xlArq]).Sheets(" Proposta").Range("AO22").Value = Range("BD25").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("AP22").Value = Range("BE25").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("AQ22").Value = Range("BF25").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("AR22").Value = Range("BG25").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("AM22").Value = Range("BK25").Value   ' 13082022
         Workbooks([xlArq]).Sheets(" Proposta").Range("AN22").Value = Range("BL25").Value   ' 13082022
         
         'GSOL01924692 - INI NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018
         Workbooks([xlArq]).Sheets(" Proposta").Range("AS22").Value = Range("BH25").Value ' Tipo de Pessoa
         Workbooks([xlArq]).Sheets(" Proposta").Range("AT22").Value = Range("BI25").Value ' Nome do Proprietário
         Workbooks([xlArq]).Sheets(" Proposta").Range("AU22").Value = Range("BJ25").Value ' CPF ou CNPJ
         'GSOL01924692 - FIM NOME E CPF PROPRIETÁRIO IMÓVEL RNM 27/03/2018
         
         'Inserir comentário com dados dos imóvel vinculado ao plano
         InserirComentImv 22
         Workbooks([xlArqBD]).Activate
          
         For lngLinCel = 122 To 126 'Financiamentos existentes
             Workbooks([xlArq]).Sheets(" Proposta").Range("D" & [lngLinCel] + 7).Value = Range("AG" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("G" & [lngLinCel] + 7).Value = Range("AH" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("I" & [lngLinCel] + 7).Value = Range("BR" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("J" & [lngLinCel] + 7).Value = Range("BS" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("K" & [lngLinCel] + 7).Value = Range("AI" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("L" & [lngLinCel] + 7).Value = Range("AJ" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("N" & [lngLinCel] + 7).Value = Range("AK" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("O" & [lngLinCel] + 7).Value = Range("BP" & [lngLinCel]).Value
         Next lngLinCel
         
         'Garantias
         Workbooks([xlArq]).Sheets(" Proposta").Range("Y136").Value = Range("AN122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("E136").Value = Range("AO122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("E137").Value = Range("AP122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("H137").Value = Range("AQ122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("M136").Value = Range("AR122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("M137").Value = Range("AS122").Value
         
         Workbooks([xlArq]).Sheets(" Proposta").Range("Y138").Value = Range("AN123").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("E138").Value = Range("AO123").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("E139").Value = Range("AP123").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("H139").Value = Range("AQ123").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("M138").Value = Range("AR123").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("M139").Value = Range("AS123").Value

         Workbooks([xlArq]).Sheets(" Proposta").Range("D155").Value = Range("BA122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("E155").Value = Range("BB122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("D158").Value = Range("BD122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Range("D160").Value = Range("BE122").Value
         
         'Opção da declaração
         Workbooks([xlArq]).Sheets(" Proposta").Range("Y161").Value = IIf(Range("BF122").Value = vbNullString, 1, Range("BF122").Value)
         For lngLinCel = 122 To 129
             Workbooks([xlArq]).Sheets(" Proposta").Range("D" & [lngLinCel] + 44).Value = Range("BG" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("F" & [lngLinCel] + 44).Value = Range("BH" & [lngLinCel]).Value
             Workbooks([xlArq]).Sheets(" Proposta").Range("H" & [lngLinCel] + 44).Value = Range("BI" & [lngLinCel]).Value
             'GSOL00094929
             If CDate(Range("A4").Value) >= dtVersaoAtual Then
                Workbooks([xlArq]).Sheets(" Proposta").Range("J" & [lngLinCel] + 44).Value = Range("BJ" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets(" Proposta").Range("L" & [lngLinCel] + 44).Value = Range("BK" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets(" Proposta").Range("N" & [lngLinCel] + 44).Value = Range("BL" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets(" Proposta").Range("O" & [lngLinCel] + 44).Value = Range("BO" & [lngLinCel]).Value
             Else
                Workbooks([xlArq]).Sheets(" Proposta").Range("J" & [lngLinCel] + 44).Value = Range("BL" & [lngLinCel]).Value
                Workbooks([xlArq]).Sheets(" Proposta").Range("O" & [lngLinCel] + 44).Value = Range("BJ" & [lngLinCel]).Value
             End If
             
         Next lngLinCel
         
         'GSOL00083049
         Workbooks([xlArq]).Sheets("VISAO").Range("FP12").Value = Range("BN122").Value
         Workbooks([xlArq]).Sheets("VISAO").Range("FP13").Value = Range("BN123").Value
         Workbooks([xlArq]).Sheets("VISAO").Range("FP14").Value = Range("BN124").Value
         Workbooks([xlArq]).Sheets("VISAO").Range("FP15").Value = Range("BN125").Value
         Workbooks([xlArq]).Sheets("VISAO").Range("FQ12").Value = Range("BN122").Value
         
         'Tipo de custo de assessoria informado (% ou R$)
         'Sprint 6.2 Forçar o percentual ou valor para Taxa de Elaboração
         Workbooks([xlArq]).Sheets(" Proposta").Range("H71").Value = Range("BQ122").Value
         Workbooks([xlArq]).Sheets(" Proposta").Calculate
         If (Range("BQ122").Value = 1) Then
           Workbooks([xlArq]).Sheets(" Proposta").Range("H71").Value = 1
           If (Workbooks([xlArq]).Sheets(" Proposta").Range("H69").Value > 2) Then
               Workbooks([xlArq]).Sheets(" Proposta").Range("H69").Value = 2
           End If
         Else
           Workbooks([xlArq]).Sheets(" Proposta").Range("H71").Value = 2
           If Workbooks([xlArq]).Sheets(" Proposta").Range("H69").Value > Workbooks([xlArq]).Sheets(" Proposta").Range("Q69").Value Then
              Workbooks([xlArq]).Sheets(" Proposta").Range("H69").Value = Workbooks([xlArq]).Sheets(" Proposta").Range("Q69").Value
           End If
         End If

        'GSOL01921068 - SEAP/PLANILHAS-PLANO SAFRA 2018/2019 - RNM - INI 25/07/2018
         Workbooks([xlArq]).Sheets(" Proposta").Range("AN193").Value = Range("BT122").Value
        'GSOL01921068 - SEAP/PLANILHAS-PLANO SAFRA 2018/2019 - RNM - FIM 25/07/2018
         
         ImportaProjetoProposta = 1
         Exit Function

erroImportaProjetoProposta:
         ImportaProjetoProposta = -1
End Function



Function ImportaProjetoCoordGeodesicas(xlArq As String, xlArqBD As String) As Integer
         'COORDENADAS GEODESICAS  INI RNM - GSOL00969220 25/01/2016
         Dim lngLinBD As Long
         On Error GoTo erroImportaProjetoCoordGeodesicas
         Windows([xlArqBD]).Activate
         Workbooks([xlArq]).Sheets("geodesica").Unprotect Password:="senhasBNxl"
         Workbooks([xlArq]).Sheets("geodesica").Range("A2:E97").ClearContents        'Sprint 11 04/2017 - Limpar resumo
         Workbooks([xlArq]).Sheets("geodesica").Range("A101:S" & Rows.Count).ClearContents
         Workbooks([xlArq]).Sheets("geodesica").Range("M2:N97").ClearContents
         Workbooks([xlArq]).Sheets("geodesica").Range("BA101:BP" & Rows.Count).ClearContents 'Sprint 11 04/2017 - Limpar resumo
         
         Workbooks([xlArq]).Sheets("Busca").Unprotect Password:="senhasBNxl"
         Workbooks([xlArq]).Sheets("Busca").Range("CA2:CM" & Rows.Count).ClearContents
                  
         Application.ScreenUpdating = False
         lngLinBD = 2
         lngLinSel = 101
         Do While lngLinSel <= Range("HA1").Value
           'DoEvents
           
           'Workbooks([xlArq]).Sheets("geodesica").Range("A" & [lngLinSel]).FormulaLocal = "=CONCATENAR(" & "C" & [lngLinSel] & ";D" & [lngLinSel] & ")"      'Chave da inversão
           'Workbooks([xlArq]).Sheets("geodesica").Range("B" & [lngLinSel]).FormulaLocal = "=CONCATENAR(" & "A" & [lngLinSel] & ";SE(NÚM.CARACT(F" & [lngLinSel] & ")=1;" & """" & "0" & """" & ";" & """" & """" & ");F" & _
                                                                     [lngLinSel] & ";SE(NÚM.CARACT(I" & [lngLinSel] & ")=1;" & """" & "0" & """" & ";" & """" & """" & ");I" & [lngLinSel] & ")" 'Chave da Gleba
           Workbooks([xlArq]).Sheets("geodesica").Range("C" & [lngLinSel]).Value = Range("HA" & [lngLinBD]).Value   ' SQ_INV
           'Workbooks([xlArq]).Sheets("geodesica").Range("D" & [lngLinSel]).FormulaLocal = "=PROCV(C" & [lngLinSel] & ";Inv_Geodesica;2;FALSO)"  'NOME DA INVERSÃO
           'Workbooks([xlArq]).Sheets("geodesica").Range("E" & [lngLinSel]).FormulaLocal = "=PROCV(C" & [lngLinSel] & ";Inv_Geodesica;3;FALSO)"   'Cod Empreendimento
           Workbooks([xlArq]).Sheets("geodesica").Range("F" & [lngLinSel]).Value = Format(Str(Range("HD" & [lngLinBD]).Value), "00")     ' CD_GLB 'Sprint 11 04/2017
           Workbooks([xlArq]).Sheets("geodesica").Range("G" & [lngLinSel]).Value = Range("HE" & [lngLinBD]).Value   ' COD GLEBA
           Workbooks([xlArq]).Sheets("geodesica").Range("H" & [lngLinSel]).Value = Range("HF" & [lngLinBD]).Value   ' AR_NAO_CUL
           Workbooks([xlArq]).Sheets("geodesica").Range("I" & [lngLinSel]).Value = Range("HG" & [lngLinBD]).Value   ' SQ_COO_GLE
           Workbooks([xlArq]).Sheets("geodesica").Range("J" & [lngLinSel]).Value = Range("HH" & [lngLinBD]).Value   ' VR_LAT
           Workbooks([xlArq]).Sheets("geodesica").Range("K" & [lngLinSel]).Value = Range("HI" & [lngLinBD]).Value   ' VR_LGT
           Workbooks([xlArq]).Sheets("geodesica").Range("L" & [lngLinSel]).Value = Range("HJ" & [lngLinBD]).Value   ' VR_ALT
          ' Workbooks([xlArq]).Sheets("geodesica").Range("M" & [lngLinSel]).FormulaR1C1 = "=ROW(RC[-1])"               'ID
           'Workbooks([xlArq]).Sheets("geodesica").Range("N" & [lngLinSel]).FormulaLocal = "=PROCV(G" & [lngLinSel] & ";Cod_Gleba;2;FALSO)" ' TP_GLB
           'Workbooks([xlArq]).Sheets("geodesica").Range("O" & [lngLinSel]).FormulaLocal = "=PROCV(G" & [lngLinSel] & ";Cod_Gleba;3;FALSO)" 'Limite"
           'Workbooks([xlArq]).Sheets("geodesica").Range("P" & [lngLinSel]).FormulaLocal = "=CONCATENAR(C" & [lngLinSel] & ";F" & [lngLinSel] & ")"   'Gleba/ponto
           'Workbooks([xlArq]).Sheets("geodesica").Range("Q" & [lngLinSel]).Value = 1                                           'Fixo  =1
           'Workbooks([xlArq]).Sheets("geodesica").Range("S" & [lngLinSel]).FormulaLocal = "=SE(R" & [lngLinSel] & "<O" & [lngLinSel] & ";-1;0)"  ' Critica    Loop
           Workbooks([xlArq]).Sheets("geodesica").Range("T" & [lngLinSel]).Value = Range("HN" & [lngLinBD]).Value   ' ST_Edc_Glb  'Sprint 11 04/2017 - Novo campo coordenadas geodesicas
           lngLinSel = lngLinSel + 1
           lngLinBD = lngLinBD + 1
        Loop
       
        'Atualizar a tela
        Workbooks([xlArq]).Sheets("geodesica").Range("B99").Calculate
        
'        For i = 101 To bd10Geodesica.Range("B99").Value + 100
'          Workbooks([xlArq]).Sheets("geodesica").Range("R" & [i]).FormulaLocal = "=SOMASE($P$101:$Q$" & Workbooks([xlArq]).Sheets("geodesica").Range("B99").Value + 100 & ";P" & [i] & ";$Q$101:$Q$" & Workbooks([xlArq]).Sheets("geodesica").Range("B99").Value + 100 & ")"
'        Next i
        
       'Historico de Inversão para eventual alteração de inversão.
       For L_Inv = 2 To 97
           Workbooks([xlArq]).Sheets("geodesica").Range("M" & [L_Inv]).Value = Workbooks([xlArq]).Sheets("geodesica").Range("A" & [L_Inv]).Value
           Workbooks([xlArq]).Sheets("geodesica").Range("N" & [L_Inv]).Value = Workbooks([xlArq]).Sheets("geodesica").Range("B" & [L_Inv]).Value
           Workbooks([xlArq]).Sheets("geodesica").Range("O" & [L_Inv]).Value = Workbooks([xlArq]).Sheets("geodesica").Range("C" & [L_Inv]).Value
       Next L_Inv
       'COORDENADAS GEODESICAS  RNM - GSOL00969220 25/01/2016
       xl00Busca.Visible = xlSheetVeryHidden
       
       'Sprint 11 04/2017 - Organizar e gravar resumo - ini
       Call InserirFormulasGleba(101)
       Call InserirResumoGleba
       Call OrdenarResumoGleba
       Call CargaIniGeodesica
       Call LimparGlebasSemInv
       'Sprint 11 04/2017 - Organizar e gravar resumo - fim
       Call Limpar_Gleba '28/10/2020
       'Chamado limpar projeto Geodesica 25/11/2020
       Call Limpar_Geodesica

       
       ImportaProjetoCoordGeodesicas = 1
         Exit Function

erroImportaProjetoCoordGeodesicas:
         ImportaProjetoCoordesicas = -1
End Function

Function ImportaProjetoAtivAgricola(xlArq As String, xlArqBD As String) As Integer
         Dim lngLinBD As Long, lngLinCel As Long, lngColCel As Long
         On Error GoTo erroImportaProjetoAtivAgricola
         'Congelar a tela para ser mais rápido
         Application.ScreenUpdating = False
         Workbooks([xlArqBD]).Activate
         Range("F322").Select
         For lngLinBD = 322 To 392 'Uso atual e projetado
             For lngColCel = 6 To 38
                 If lngLinBD <> 357 Then
                    Workbooks([xlArq]).Sheets("Ativ. Agrícola").Cells([lngLinBD] - 314, [lngColCel]) = Cells([lngLinBD], [lngColCel]).Value
                    If (lngLinBD >= 352 And lngLinBD < 358) Or _
                       lngLinBD > 388 Then
                       Workbooks([xlArq]).Sheets("Ativ. Agrícola").Cells([lngLinBD] - 314, "D") = Cells([lngLinBD], "D").Value
                       'Workbooks([xlArq]).Sheets("Ativ. Agrícola").Cells([lngLinBD] - 314, "E") = Cells([lngLinBD], "E").Value
                    End If
                 End If
             Next lngColCel
         Next lngLinBD
         'GSOL00277827
         For lngLinBD = 322 To 392 'Uso atual e projetado anos 17-30
             For lngColCel = 157 To 184
                 If lngLinBD <> 357 Then
                    Workbooks([xlArq]).Sheets("Ativ. Agrícola").Cells([lngLinBD] - 314, [lngColCel] - 118) = Cells([lngLinBD], [lngColCel]).Value
                 End If
             Next lngColCel
         Next lngLinBD
         
         Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("A122").Value = Range("AX322").Value
         For lngLinBD = 322 To 356  'Receitas agrícolas
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("E" & [lngLinBD] - 237).Value = Range("BA" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("G" & [lngLinBD] - 237).Value = Range("BB" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("I" & [lngLinBD] - 237).Value = Range("BC" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("K" & [lngLinBD] - 237).Value = Range("BD" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("L" & [lngLinBD] - 237).Value = Range("BE" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("M" & [lngLinBD] - 237).Value = Range("BF" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("N" & [lngLinBD] - 237).Value = Range("BG" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("O" & [lngLinBD] - 237).Value = Range("BH" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("P" & [lngLinBD] - 237).Value = Range("BI" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Q" & [lngLinBD] - 237).Value = Range("BJ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("R" & [lngLinBD] - 237).Value = Range("BK" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("S" & [lngLinBD] - 237).Value = Range("BL" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("T" & [lngLinBD] - 237).Value = Range("BM" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("U" & [lngLinBD] - 237).Value = Range("BN" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("V" & [lngLinBD] - 237).Value = Range("BO" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("W" & [lngLinBD] - 237).Value = Range("BP" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("X" & [lngLinBD] - 237).Value = Range("BQ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Y" & [lngLinBD] - 237).Value = Range("BR" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Z" & [lngLinBD] - 237).Value = Range("BS" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AA" & [lngLinBD] - 237).Value = Range("BT" & [lngLinBD]).Value
             'GSOL00277827
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AB" & [lngLinBD] - 237).Value = Range("EA" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AC" & [lngLinBD] - 237).Value = Range("EB" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AD" & [lngLinBD] - 237).Value = Range("EC" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AE" & [lngLinBD] - 237).Value = Range("ED" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AF" & [lngLinBD] - 237).Value = Range("EE" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AG" & [lngLinBD] - 237).Value = Range("EF" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AH" & [lngLinBD] - 237).Value = Range("EG" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AI" & [lngLinBD] - 237).Value = Range("EH" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AJ" & [lngLinBD] - 237).Value = Range("EI" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AK" & [lngLinBD] - 237).Value = Range("EJ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AL" & [lngLinBD] - 237).Value = Range("EK" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AM" & [lngLinBD] - 237).Value = Range("EL" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AN" & [lngLinBD] - 237).Value = Range("EM" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AO" & [lngLinBD] - 237).Value = Range("EN" & [lngLinBD]).Value
             
         Next lngLinBD

         For lngLinBD = 322 To 356  'Custos agrícolas
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("E" & [lngLinBD] - 196).Value = Range("CA" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("G" & [lngLinBD] - 196).Value = Range("CB" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("I" & [lngLinBD] - 196).Value = Range("CC" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("K" & [lngLinBD] - 196).Value = Range("CD" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("M" & [lngLinBD] - 196).Value = Range("CE" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("O" & [lngLinBD] - 196).Value = Range("CF" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Q" & [lngLinBD] - 196).Value = Range("CG" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("S" & [lngLinBD] - 196).Value = Range("CH" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("U" & [lngLinBD] - 196).Value = Range("CI" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("W" & [lngLinBD] - 196).Value = Range("CJ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Y" & [lngLinBD] - 196).Value = Range("CK" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AA" & [lngLinBD] - 196).Value = Range("CL" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AC" & [lngLinBD] - 196).Value = Range("CM" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AE" & [lngLinBD] - 196).Value = Range("CN" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AG" & [lngLinBD] - 196).Value = Range("CO" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AI" & [lngLinBD] - 196).Value = Range("CP" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AK" & [lngLinBD] - 196).Value = Range("CQ" & [lngLinBD]).Value
             'GSOL00277827
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AM" & [lngLinBD] - 196).Value = Range("CR" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AO" & [lngLinBD] - 196).Value = Range("CS" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AQ" & [lngLinBD] - 196).Value = Range("CT" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AS" & [lngLinBD] - 196).Value = Range("CU" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AU" & [lngLinBD] - 196).Value = Range("CV" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AW" & [lngLinBD] - 196).Value = Range("CW" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AY" & [lngLinBD] - 196).Value = Range("CX" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("BA" & [lngLinBD] - 196).Value = Range("CY" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("BC" & [lngLinBD] - 196).Value = Range("CZ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("BE" & [lngLinBD] - 196).Value = Range("DA" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("BG" & [lngLinBD] - 196).Value = Range("DB" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("BI" & [lngLinBD] - 196).Value = Range("DC" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("BK" & [lngLinBD] - 196).Value = Range("DD" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("BM" & [lngLinBD] - 196).Value = Range("DE" & [lngLinBD]).Value
             
         Next lngLinBD

         For lngLinBD = 762 To 796  'Atividades Econômicas
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("E" & [lngLinBD] - 596).Value = Range("F" & [lngLinBD]).Value
         Next lngLinBD

         ImportaProjetoAtivAgricola = 1
         Exit Function

erroImportaProjetoAtivAgricola:
         ImportaProjetoAtivAgricola = -1
End Function
Function ImportaProjetoAtivAgricolaOld(xlArq As String, xlArqBD As String) As Integer
         Dim lngLinBD As Long, lngLinCel As Long, lngColCel As Long
         On Error GoTo erroImportaProjetoAtivAgricola
         'Congelar a tela para ser mais rápido
         Application.ScreenUpdating = False
         Workbooks([xlArqBD]).Activate
         Range("F322").Select
         For lngLinBD = 322 To 392 'Uso atual e projetado
             For lngColCel = 6 To 30
                 If lngLinBD <> 357 Then
                    Workbooks([xlArq]).Sheets("Ativ. Agrícola").Cells([lngLinBD] - 314, [lngColCel]) = Cells([lngLinBD], [lngColCel]).Value
                    If (lngLinBD > 352 And lngLinBD < 358) Or _
                       lngLinBD > 388 Then
                       Workbooks([xlArq]).Sheets("Ativ. Agrícola").Cells([lngLinBD] - 314, "D") = Cells([lngLinBD], "D").Value
                       'Workbooks([xlArq]).Sheets("Ativ. Agrícola").Cells([lngLinBD] - 314, "E") = Cells([lngLinBD], "E").Value
                    End If
                 End If
             Next lngColCel
         Next lngLinBD
         
         Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("A122").Value = Range("AX322").Value
         For lngLinBD = 322 To 356  'Receitas agrícolas
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("E" & [lngLinBD] - 237).Value = Range("AG" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("G" & [lngLinBD] - 237).Value = Range("AH" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("I" & [lngLinBD] - 237).Value = Range("AI" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("K" & [lngLinBD] - 237).Value = Range("AJ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("L" & [lngLinBD] - 237).Value = Range("AK" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("M" & [lngLinBD] - 237).Value = Range("AL" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("N" & [lngLinBD] - 237).Value = Range("AM" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("O" & [lngLinBD] - 237).Value = Range("AN" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("P" & [lngLinBD] - 237).Value = Range("AO" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Q" & [lngLinBD] - 237).Value = Range("AP" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("R" & [lngLinBD] - 237).Value = Range("AQ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("S" & [lngLinBD] - 237).Value = Range("AR" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("T" & [lngLinBD] - 237).Value = Range("AS" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("U" & [lngLinBD] - 237).Value = Range("AT" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("V" & [lngLinBD] - 237).Value = Range("AU" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("W" & [lngLinBD] - 237).Value = Range("AV" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("X" & [lngLinBD] - 237).Value = Range("AW" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Y" & [lngLinBD] - 237).Value = Range("AX" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Z" & [lngLinBD] - 237).Value = Range("AY" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AA" & [lngLinBD] - 237).Value = Range("AZ" & [lngLinBD]).Value
         Next lngLinBD

         For lngLinBD = 322 To 356  'Custos agrícolas
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("E" & [lngLinBD] - 196).Value = Range("AY" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("G" & [lngLinBD] - 196).Value = Range("AZ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("I" & [lngLinBD] - 196).Value = Range("BA" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("K" & [lngLinBD] - 196).Value = Range("BB" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("M" & [lngLinBD] - 196).Value = Range("BC" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("O" & [lngLinBD] - 196).Value = Range("BD" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Q" & [lngLinBD] - 196).Value = Range("BE" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("S" & [lngLinBD] - 196).Value = Range("BF" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("U" & [lngLinBD] - 196).Value = Range("BG" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("W" & [lngLinBD] - 196).Value = Range("BH" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("Y" & [lngLinBD] - 196).Value = Range("BI" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AA" & [lngLinBD] - 196).Value = Range("BJ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AC" & [lngLinBD] - 196).Value = Range("BK" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AE" & [lngLinBD] - 196).Value = Range("BL" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AG" & [lngLinBD] - 196).Value = Range("BM" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AI" & [lngLinBD] - 196).Value = Range("BN" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Agrícola").Range("AK" & [lngLinBD] - 196).Value = Range("BO" & [lngLinBD]).Value
         Next lngLinBD
         
         ImportaProjetoAtivAgricolaOld = 1
         Exit Function

erroImportaProjetoAtivAgricola:
         ImportaProjetoAtivAgricolaOld = -1
End Function

Function ImportaProjetoAtivPecuaria(xlArq As String, xlArqBD As String) As Integer
         Dim lngLinBD As Long, lngLinCel As Long
         On Error GoTo erroImportaProjetoAtivPecuaria
         'Congelar a tela para ser mais rápido
         Application.ScreenUpdating = False
         Workbooks([xlArqBD]).Activate
         Range("E422").Select
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A13").Value = Range("E422").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A14").Value = Range("F422").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A16").Value = Range("G422").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A35").Value = Range("E423").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A36").Value = Range("F423").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A38").Value = Range("G423").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A52").Value = Range("E424").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A53").Value = Range("F424").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A55").Value = Range("G424").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A68").Value = Range("E425").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A69").Value = Range("F425").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("A71").Value = Range("G425").Value
         
         '--- Bovino Leite
        ' Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("G17").Value = Range("H422").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("I17").Value = Range("I422").Value
         For lngLinBD = 423 To 429
         '    Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("G" & [lngLinBD] - 405).Value = Range("H" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("I" & [lngLinBD] - 405).Value = Range("I" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("N" & [lngLinBD] - 405).Value = Range("J" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("O" & [lngLinBD] - 405).Value = Range("K" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("P" & [lngLinBD] - 405).Value = Range("L" & [lngLinBD]).Value
         Next lngLinBD
         Range("M422").Select
         lngLinCel = 27
         While ActiveCell.Column <= 18
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "G").Value = ActiveCell.Value
               If lngLinCel = 27 Then
                  lngLinCel = lngLinCel + 2
               Else
                  lngLinCel = lngLinCel + 1
               End If
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 27
         While ActiveCell.Column <= 24
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "Q").Value = ActiveCell.Value
               If lngLinCel = 28 Then
                  lngLinCel = lngLinCel + 2
               Else
                  lngLinCel = lngLinCel + 1
               End If
               ActiveCell.Offset(0, 1).Select
         Wend
         '--- Bovino Corte
         'Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("G39").Value = Range("H430").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("I39").Value = Range("I430").Value
         For lngLinBD = 431 To 437
          '   Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("G" & [lngLinBD] - 391).Value = Range("H" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("I" & [lngLinBD] - 391).Value = Range("I" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("N" & [lngLinBD] - 391).Value = Range("J" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("O" & [lngLinBD] - 391).Value = Range("K" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("P" & [lngLinBD] - 391).Value = Range("L" & [lngLinBD]).Value
         Next lngLinBD
         Range("M430").Select
         lngLinCel = 48
         While ActiveCell.Column <= 15
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "G").Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 48
         While ActiveCell.Column <= 18
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "Q").Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         '--- Ovino
         'Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("G56").Value = Range("H438").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("I56").Value = Range("I438").Value
         For lngLinBD = 439 To 443
          '   Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("G" & [lngLinBD] - 382).Value = Range("H" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("I" & [lngLinBD] - 382).Value = Range("I" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("N" & [lngLinBD] - 382).Value = Range("J" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("O" & [lngLinBD] - 382).Value = Range("K" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("P" & [lngLinBD] - 382).Value = Range("L" & [lngLinBD]).Value
         Next lngLinBD
         Range("M438").Select
         lngLinCel = 63
         While ActiveCell.Column <= 16
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "G").Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 63
         While ActiveCell.Column <= 19
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "Q").Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         '--- Caprino
         'Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("G72").Value = Range("H444").Value
         Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("I72").Value = Range("I444").Value
         For lngLinBD = 445 To 449
          '   Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("G" & [lngLinBD] - 372).Value = Range("H" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("I" & [lngLinBD] - 372).Value = Range("I" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("N" & [lngLinBD] - 372).Value = Range("J" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("O" & [lngLinBD] - 372).Value = Range("K" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Ativ. Pecuária").Range("P" & [lngLinBD] - 372).Value = Range("L" & [lngLinBD]).Value
         Next lngLinBD
         Range("M444").Select
         lngLinCel = 79
         While ActiveCell.Column <= 16
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "G").Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 79
         While ActiveCell.Column <= 19
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "L").Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend
         lngLinCel = 79
         While ActiveCell.Column <= 22
               Workbooks([xlArq]).Sheets("Ativ. Pecuária").Cells([lngLinCel], "Q").Value = ActiveCell.Value
               lngLinCel = lngLinCel + 1
               ActiveCell.Offset(0, 1).Select
         Wend

         For lngLinBD = 797 To 800  'Atividades Econômicas
             xl06AtivPec.Range("L" & [lngLinBD] - 790).Value = Range("F" & [lngLinBD]).Value
         Next lngLinBD
        
         ImportaProjetoAtivPecuaria = 1
         Exit Function

erroImportaProjetoAtivPecuaria:
         ImportaProjetoAtivPecuaria = -1
End Function

Function ImportaProjetoOutraAtiv(xlArq As String, xlArqBD As String) As Integer
         Dim lngLinBD As Long
         On Error GoTo erroImportaProjetoOutraAtiv
         Workbooks([xlArqBD]).Activate
         Range("E522").Select
         For lngLinBD = 522 To 531
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("D" & [lngLinBD] - 507).Value = Range("E" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("E" & [lngLinBD] - 507).Value = Range("F" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("F" & [lngLinBD] - 507).Value = Range("G" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("F" & [lngLinBD] - 476).Value = Range("H" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("G" & [lngLinBD] - 507).Value = Range("I" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("G" & [lngLinBD] - 476).Value = Range("J" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("H" & [lngLinBD] - 507).Value = Range("K" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("H" & [lngLinBD] - 476).Value = Range("L" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("I" & [lngLinBD] - 507).Value = Range("M" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("I" & [lngLinBD] - 476).Value = Range("N" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("J" & [lngLinBD] - 507).Value = Range("O" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("J" & [lngLinBD] - 476).Value = Range("P" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("K" & [lngLinBD] - 507).Value = Range("Q" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("K" & [lngLinBD] - 476).Value = Range("R" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("L" & [lngLinBD] - 507).Value = Range("S" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("L" & [lngLinBD] - 476).Value = Range("T" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("M" & [lngLinBD] - 507).Value = Range("U" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("M" & [lngLinBD] - 476).Value = Range("V" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("N" & [lngLinBD] - 507).Value = Range("W" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("N" & [lngLinBD] - 476).Value = Range("X" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("O" & [lngLinBD] - 507).Value = Range("Y" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("O" & [lngLinBD] - 476).Value = Range("Z" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("P" & [lngLinBD] - 507).Value = Range("AA" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("P" & [lngLinBD] - 476).Value = Range("AB" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("Q" & [lngLinBD] - 507).Value = Range("AC" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("Q" & [lngLinBD] - 476).Value = Range("AD" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("R" & [lngLinBD] - 507).Value = Range("AE" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("R" & [lngLinBD] - 476).Value = Range("AF" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("S" & [lngLinBD] - 507).Value = Range("AG" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("S" & [lngLinBD] - 476).Value = Range("AH" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("T" & [lngLinBD] - 507).Value = Range("AI" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("T" & [lngLinBD] - 476).Value = Range("AJ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("U" & [lngLinBD] - 507).Value = Range("AK" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("U" & [lngLinBD] - 476).Value = Range("AL" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("V" & [lngLinBD] - 507).Value = Range("AM" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("V" & [lngLinBD] - 476).Value = Range("AN" & [lngLinBD]).Value
             
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("W" & [lngLinBD] - 507).Value = Range("AO" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("W" & [lngLinBD] - 476).Value = Range("AP" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("X" & [lngLinBD] - 507).Value = Range("AQ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("X" & [lngLinBD] - 476).Value = Range("AR" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("Y" & [lngLinBD] - 507).Value = Range("AS" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("Y" & [lngLinBD] - 476).Value = Range("AT" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("Z" & [lngLinBD] - 507).Value = Range("AU" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("Z" & [lngLinBD] - 476).Value = Range("AV" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AA" & [lngLinBD] - 507).Value = Range("AW" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AA" & [lngLinBD] - 476).Value = Range("AX" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AB" & [lngLinBD] - 507).Value = Range("AY" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AB" & [lngLinBD] - 476).Value = Range("AZ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AC" & [lngLinBD] - 507).Value = Range("BA" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AC" & [lngLinBD] - 476).Value = Range("BB" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AD" & [lngLinBD] - 507).Value = Range("BC" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AD" & [lngLinBD] - 476).Value = Range("BD" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AE" & [lngLinBD] - 507).Value = Range("BE" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AE" & [lngLinBD] - 476).Value = Range("BF" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AF" & [lngLinBD] - 507).Value = Range("BG" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AF" & [lngLinBD] - 476).Value = Range("BH" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AG" & [lngLinBD] - 507).Value = Range("BI" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AG" & [lngLinBD] - 476).Value = Range("BJ" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AH" & [lngLinBD] - 507).Value = Range("BK" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AH" & [lngLinBD] - 476).Value = Range("BL" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AI" & [lngLinBD] - 507).Value = Range("BM" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AI" & [lngLinBD] - 476).Value = Range("BN" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AJ" & [lngLinBD] - 507).Value = Range("BO" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("AJ" & [lngLinBD] - 476).Value = Range("BP" & [lngLinBD]).Value
             
             
         Next lngLinBD
         Workbooks([xlArq]).Sheets("Outras Ativ").Range("F70").Value = Range("G540").Value
         For lngLinBD = 541 To 546
             If lngLinBD - 464 > 80 Then Workbooks([xlArq]).Sheets("Outras Ativ").Range("D" & [lngLinBD] - 464).Value = Range("E" & [lngLinBD]).Value
             Workbooks([xlArq]).Sheets("Outras Ativ").Range("F" & [lngLinBD] - 464).Value = Range("H" & [lngLinBD]).Value
         Next lngLinBD

         For lngLinBD = 801 To 810  'Atividades Econômicas
             xl07OutAtv.Range("E" & [lngLinBD] - 708).Value = Range("F" & [lngLinBD]).Value
         Next lngLinBD

         ImportaProjetoOutraAtiv = 1
         Exit Function

erroImportaProjetoOutraAtiv:
         ImportaProjetoOutraAtiv = -1
End Function


Function ImportaProjetoBaseFin(xlArq As String, xlArqBD As String) As Integer
         Dim lngLinBD As Long
         Dim intContador As Integer
         On Error GoTo erroImportaProjetoBaseFin
         
         Workbooks([xlArqBD]).Activate
         Workbooks([xlArq]).Sheets("CalculoFinanceiro").Unprotect Password:="senhasBNxl"
         Range("E722").Select
         Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("D13").Value = Range("E722").Value
         Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("D14").Value = Range("F722").Value
         Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("D15").Value = Range("G722").Value
         If checarVersaoPlanilha("A4") < CDate("30/11/2005") Then
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("X18").Value = Range("H722").Value
            Workbooks([xlArq]).Activate
            Calculate
            Sheets("CalculoFinanceiro").Range("D16").Value = Sheets("CalculoFinanceiro").Range("X19").Value
            Workbooks([xlArqBD]).Activate
         Else
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("D16").Value = Range("H722").Value
         End If
         'RTC 31115 - Plano Safra 2016/2017
         Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD17").Value = "Sim"  'RTC 31115 - Plano Safra 2016/2017
         'Sprint 11 04/2017 - RNM - Se não houver preenchimento de Prazo em meses limpar a ficha 2
         If Range("E723").Value <> vbNullString Then
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD13").Value = Range("E723").Value
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD14").Value = Range("F723").Value
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD15").Value = Range("G723").Value
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD16").Value = Range("H723").Value
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("D17").Value = "Sim"
         Else
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD13").Value = vbNullString
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD14").Value = vbNullString
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD15").Value = vbNullString
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD16").Value = vbNullString
            Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("D17").Value = "Não"
         End If
         'Sprint 11 04/2017 - RNM - Se não houver preenchimento de Prazo em meses limpar a ficha 2
         'RTC 31115 - Plano Safra 2016/2017
         
         Workbooks([xlArq]).Activate
         Sheets("CalculoFinanceiro").Activate
         Calculate
         calcularAmortizacao 1
         calcularAmortizacao_2 1  'RTC 31115 - Plano Safra 2016/2017
         Calculate
         CalcFin = 0
         Workbooks([xlArqBD]).Activate
         
         Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("D17").Value = Range("I722").Value
         Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DD17").Value = Range("I723").Value
         
         If checarVersaoPlanilha("A4") < CDate("30/11/2005") Then
            For lngLinBD = 722 To 745
                Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("N" & [lngLinBD] - 710).Value = _
                    WorksheetFunction.Round(Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("K" & [lngLinBD] - 710).Value * Range("M" & [lngLinBD]).Value / 100, 2)
                Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DN" & [lngLinBD] - 710).Value = _
                    WorksheetFunction.Round(Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DK" & [lngLinBD] - 710).Value * Range("N" & [lngLinBD]).Value / 100, 2)  'RTC 31115 - Plano Safra 2016/2017
            Next lngLinBD
         Else
            For lngLinBD = 722 To 745
                Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("N" & [lngLinBD] - 710).Value = Range("M" & [lngLinBD]).Value
                Workbooks([xlArq]).Sheets("CalculoFinanceiro").Range("DN" & [lngLinBD] - 710).Value = Range("N" & [lngLinBD]).Value  'RTC 31115 - Plano Safra 2016/2017
            Next lngLinBD
         End If
         Workbooks([xlArq]).Sheets("CalculoFinanceiro").Protect Password:="senhasBNxl"
         
         ImportaProjetoBaseFin = 1
         Exit Function

erroImportaProjetoBaseFin:
         ImportaProjetoBaseFin = -1
End Function

Sub GeraSEAP()
    xl00Menu.Activate
    On Error Resume Next
    Load frmGeraSEAP
End Sub

Function ImportaProjetoVersaoAnterior(xlArq As String, xlArqBD As String, dtVersao As Date) As Integer
         Dim lngLinBD As Long, lngLinCel As Long
         Dim dtVersaoBD As Date
         dtVersao = CDate("09/05/2005")
         On Error GoTo ImportaProjetoVersaoAnterior
         Workbooks([xlArqBD]).Activate
         dtVersaoBD = CDate(Right(Range("A3").Value, 10))
         If dtVersaoBD >= dtVersao Then
            ImportaProjetoVersaoAnterior = 1
            Exit Function
         End If
         'Avaliação
         Range("E22").Select
         'Imoveis vinculados ao plano
         Range("E22").Value = Range("AQ12").Value
         Range("F22").Value = Range("AV12").Value
         Range("G22").Value = Range("AR12").Value
         Range("H22").Value = "Sim"
         Range("I22").Value = "Não"
         
         For lngLinCel = 22 To 31  'Imovel 1: Terras e Coberturas
             Range("N" & [lngLinCel]).Value = Range("D" & [lngLinCel] + 300).Value
             Range("O" & [lngLinCel]).Value = Range("E" & [lngLinCel] + 300).Value
         Next lngLinCel
         For lngLinCel = 33 To 42 'Imovel 1: Terras e Coberturas
             Range("N" & [lngLinCel]).Value = Range("D" & [lngLinCel] + 325).Value
             Range("O" & [lngLinCel]).Value = Range("E" & [lngLinCel] + 325).Value
         Next lngLinCel
         
         For lngLinBD = 322 To 392 'Uso atual e projetado
             For lngColCel = 19 To 30
                  Cells([lngLinBD], [lngColCel]).Value = Cells([lngLinBD], [lngColCel] - 2)
             Next lngColCel
         Next lngLinBD
         
         For lngLinBD = 322 To 356  'Receitas agrícolas
             Range("AQ" & [lngLinBD]).Value = Range("AP" & [lngLinBD]).Value
             Range("AR" & [lngLinBD]).Value = Range("AP" & [lngLinBD]).Value
             Range("AS" & [lngLinBD]).Value = Range("AP" & [lngLinBD]).Value
             Range("AT" & [lngLinBD]).Value = Range("AP" & [lngLinBD]).Value
             Range("AU" & [lngLinBD]).Value = Range("AP" & [lngLinBD]).Value
             Range("AV" & [lngLinBD]).Value = Range("AP" & [lngLinBD]).Value
         Next lngLinBD
         For lngLinBD = 322 To 366  'Custos agrícolas
             Range("BF" & [lngLinBD]).Value = Range("BE" & [lngLinBD]).Value
             Range("BG" & [lngLinBD]).Value = Range("BE" & [lngLinBD]).Value
             Range("BH" & [lngLinBD]).Value = Range("BE" & [lngLinBD]).Value
             Range("BI" & [lngLinBD]).Value = Range("BE" & [lngLinBD]).Value
             Range("BJ" & [lngLinBD]).Value = Range("BE" & [lngLinBD]).Value
             Range("BK" & [lngLinBD]).Value = Range("BE" & [lngLinBD]).Value
         Next lngLinBD
         
         '- Indicadores Semoventes
         Range("AV22").Value = Range("E422").Value
         Range("AW22").Value = Range("F422").Value
         Range("AV23").Value = Range("E423").Value
         Range("AW23").Value = Range("F423").Value
         Range("AV24").Value = Range("E424").Value
         Range("AW24").Value = Range("F424").Value
         Range("AV25").Value = Range("E425").Value
         Range("AW25").Value = Range("F425").Value
         
         Range("AY22").Value = "Bovinos de Leite"
         Range("AY23").Value = Range("H422").Value
         Range("AY24").Value = Range("H423").Value
         Range("AY25").Value = Range("H424").Value
         Range("AY26").Value = Range("H425").Value
         Range("AY27").Value = Range("H426").Value
         Range("AY28").Value = Range("H427").Value
         Range("AY29").Value = Range("H428").Value
         Range("AY30").Value = Range("H429").Value
         
         Range("AY31").Value = "Bovinos de Corte"
         Range("AY32").Value = Range("H430").Value
         Range("AY33").Value = Range("H431").Value
         Range("AY34").Value = Range("H432").Value
         Range("AY35").Value = Range("H433").Value
         Range("AY36").Value = Range("H434").Value
         Range("AY37").Value = Range("H435").Value
         Range("AY38").Value = Range("H436").Value
         Range("AY39").Value = Range("H437").Value
         
         Range("AY40").Value = "Ovinos"
         Range("AY41").Value = Range("H438").Value
         Range("AY42").Value = Range("H439").Value
         Range("AY43").Value = Range("H440").Value
         Range("AY44").Value = Range("H441").Value
         Range("AY45").Value = Range("H442").Value
         Range("AY46").Value = Range("H443").Value
         
         Range("AY47").Value = "Caprinos"
         Range("AY48").Value = Range("H444").Value
         Range("AY49").Value = Range("H445").Value
         Range("AY50").Value = Range("H446").Value
         Range("AY51").Value = Range("H447").Value
         Range("AY52").Value = Range("H448").Value
         Range("AY53").Value = Range("H449").Value
         
         Range("AY54").Value = "Outros"
         
         ImportaProjetoVersaoAnterior = 1
         Exit Function

ImportaProjetoVersaoAnterior:
         ImportaProjetoVersaoAnterior = -1
End Function

Private Function checarVersaoPlanilha(celula As String) As Date
        checarVersaoPlanilha = IIf(Range([celula]).Value = vbNullString, _
                                    CDate("01/01/2005"), CDate(Range([celula]).Value))
End Function

'Sub Empreed_Prog()  ' RNM
'
'        Application.Calculation = xlCalculationAutomatic
'        If xl03Prop.Range("AM6").Value = ProgAtual Then Exit Sub
'
'        Dim i As Integer
'        Dim ProtPlan As clsProtecao
'        Set ProtPlan = New clsProtecao
'
'        ProtPlan.DesprotegePlanilha
'
'        Application.ScreenUpdating = False
'
'       'Pecuario
'        Sheets("VISAO").Visible = xlSheetVisible
'        Sheets("BDEmpr").Visible = xlSheetVisible
'
'        xl00Visao.Activate
'        ProtPlan.DesprotegePlanilha
'        xl00Visao.Range("AY11:BB65000").Clear
'
'        Plan1.Activate
'        ProtPlan.DesprotegePlanilha
'        Plan1.Range("EMPREEND_ANT_BNB").Select
'        If xl03Prop.Range("AM6").Value = -1 Then
'            Plan1.AutoFilterMode = False
'            Selection.AutoFilter Field:=1, Criteria1:="=999", Operator:=xlAnd
'        Else
'            If (xl03Prop.Range("AM6").Value = 140 Or xl03Prop.Range("AM6").Value = 540) Then
'               Plan1.AutoFilterMode = False
'               Selection.AutoFilter Field:=1, Criteria1:="=999", Operator:=xlAnd
'            Else
'                Plan1.AutoFilterMode = False
'                Selection.AutoFilter Field:=1, Criteria1:="=" & xl03Prop.Range("AM6").Value, Operator:=xlAnd
'            End If
'        End If
'
'        Selection.Copy
'
'        Sheets("VISAO").Visible = xlSheetVisible
'        xl00Visao.Select
'        xl00Visao.Range("AY11").Select
'        ProtPlan.DesprotegePlanilha
'        Selection.PasteSpecial xlPasteValues, xlPasteSpecialOperationNone
'        Application.CutCopyMode = False
'
'        i = 12
'        Do While xl00Visao.Range("AZ" & [i]).Value <> vbNullString
'           'xl00Visao.Range("AY" & [i]).ClearContents
'           i = i + 1
'        Loop
'        xl00Visao.Range("AY12:AY" & [i]).ClearContents
'
'        If i > 11 Then
'           ActiveWorkbook.Names.Add Name:="LISTABACEN_BUSCA", RefersToR1C1:= _
'                          "=VISAO!R11C52:R" & [i] - 1 & "C54"
'           ActiveWorkbook.Names.Add Name:="LISTABACEN_COD", RefersToR1C1:= _
'                          "=VISAO!R12C52:R" & [i] - 1 & "C54"
'           ActiveWorkbook.Names.Add Name:="LISTABACEN", RefersToR1C1:= _
'                          "=VISAO!R12C52:R" & [i] - 1 & "C52"
'
'           ActiveWorkbook.Names.Add Name:="VISAOBACEN_BUSCA", RefersToR1C1:= _
'                          "=VISAO!R11C52:R" & [i] - 1 & "C54"
'           ActiveWorkbook.Names.Add Name:="VISAOBACEN_COD", RefersToR1C1:= _
'                          "=VISAO!R12C52:R" & [i] - 1 & "C54"
'           ActiveWorkbook.Names.Add Name:="VISAOBACEN", RefersToR1C1:= _
'                          "=VISAO!R12C52:R" & [i] - 1 & "C52"
'
'        Else
'           ActiveWorkbook.Names.Add Name:="LISTABACEN_BUSCA", RefersToR1C1:= _
'                          "=VISAO!R11C52:R12C54"
'           ActiveWorkbook.Names.Add Name:="LISTABACEN_COD", RefersToR1C1:= _
'                          "=VISAO!R12C52:R12C54"
'           ActiveWorkbook.Names.Add Name:="LISTABACEN", RefersToR1C1:= _
'                          "=VISAO!R12C52:R12C52"
'
'           ActiveWorkbook.Names.Add Name:="VISAOBACEN_BUSCA", RefersToR1C1:= _
'                          "=VISAO!R11C52:R12C54"
'           ActiveWorkbook.Names.Add Name:="VISAOBACEN_COD", RefersToR1C1:= _
'                          "=VISAO!R12C52:R12C54"
'           ActiveWorkbook.Names.Add Name:="VISAOBACEN", RefersToR1C1:= _
'                          "=VISAO!R12C52:R12C52"
'
'        End If
'
'        Sheets("VISAO").Visible = xlSheetVisible
'        xl00Visao.Select
'        ProtPlan.DesprotegePlanilha
'        xl00Visao.Range("AZ12").Select
'        Selection.Sort Key1:=Range("AZ12"), Order1:=xlAscending, Header:=xlGuess, _
'             OrderCustom:=1, MatchCase:=False, Orientation:=xlTopToBottom
'
'     Sheets("VISAO").Visible = xlSheetHidden
'     Sheets("BDEmpr").Visible = xlSheetHidden

'     xl03Prop.Activate
'     xl03Prop.Range("E6").Select
         
'     Application.ScreenUpdating = True
'     ProtPlan.ProtegePlanilha
'     Set ProtPlan = Nothing
 
'End Sub

' habilita/desabilita modo de carregamento rápido
Sub CarregamentoRapido(habilitar As Boolean)
    
    If habilitar = True Then
        Application.ScreenUpdating = False
        Application.Calculation = xlCalculationManual
        Application.EnableEvents = False
        Application.DisplayAlerts = False
    Else
        Application.ScreenUpdating = True
        Application.Calculation = xlCalculationAutomatic
        Application.EnableEvents = True
        Application.DisplayAlerts = True
    End If
    
End Sub


'' nova função importar projeto
'' dia 31.03 - Joris bane

Function ImportaProjetoCronograma(xlArq As String, xlArqBD As String) As Integer
    On Error GoTo erroImportaProjetoCronograma
    
    Dim lngLinBD As Long
    Dim lngLinCel As Long
    Dim diferencaLinhas As Long
    
    Dim lobjintegra As Object
    Dim lobjemp As Object
    
    Dim protPlan As clsProtecao
    
    Dim wbOrigem As Workbook
    Dim wbDestino As Workbook
    
    Dim wsOrigem As Worksheet
    Dim wsCrono As Worksheet
    Dim wsProp As Worksheet
    
    Dim linhaDestinoCrono As Long
    Dim linhaDestinoAux As Long
    Dim cdSProd As Variant
    
    Dim screenUpdatingAnterior As Boolean
    Dim calcAnterior As XlCalculation
    Dim eventosAnterior As Boolean
    
    Set protPlan = New clsProtecao
    
    screenUpdatingAnterior = Application.ScreenUpdating
    calcAnterior = Application.Calculation
    eventosAnterior = Application.EnableEvents
    
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    Application.Calculation = xlCalculationManual
    
    protPlan.DesprotegePlanilha
    
    Set wbOrigem = Workbooks(xlArqBD)
    Set wbDestino = Workbooks(xlArq)
    
    ' Mantido o comportamento original: usa a planilha ativa do workbook de origem.
    Set wsOrigem = wbOrigem.ActiveSheet
    
    Set wsCrono = wbDestino.Sheets("Cronograma")
    Set wsProp = wbDestino.Sheets(" Proposta")
    
    lngLinCel = 207
    
    ' Loop de trazer os empreendimentos
    For lngLinBD = 222 To 260
        
        diferencaLinhas = lngLinBD - lngLinCel
        linhaDestinoCrono = lngLinBD - lngLinCel
        linhaDestinoAux = lngLinBD - 20
        
        '------------------------------------------------------------
        ' BLOCO PRINCIPAL
        '------------------------------------------------------------
        If diferencaLinhas < 128 Or diferencaLinhas > 135 Then
            
            ' Copia dados principais para J:N
            wsCrono.Range("J" & linhaDestinoCrono).Value = wsOrigem.Range("E" & lngLinBD).Text
            wsCrono.Range("K" & linhaDestinoCrono).Value = wsOrigem.Range("F" & lngLinBD).Text
            wsCrono.Range("L" & linhaDestinoCrono).Value = wsOrigem.Range("G" & lngLinBD).Text
            wsCrono.Range("M" & linhaDestinoCrono).Value = wsOrigem.Range("H" & lngLinBD).Text
            wsCrono.Range("N" & linhaDestinoCrono).Value = wsOrigem.Range("I" & lngLinBD).Text
            
            ' Copia segunda linha de apoio
            wsCrono.Range("J" & (linhaDestinoCrono + 1)).Value = wsOrigem.Range("M" & lngLinBD).Value
            wsCrono.Range("K" & (linhaDestinoCrono + 1)).Value = wsOrigem.Range("N" & lngLinBD).Value
            wsCrono.Range("L" & (linhaDestinoCrono + 1)).Value = wsOrigem.Range("O" & lngLinBD).Value
            wsCrono.Range("M" & (linhaDestinoCrono + 1)).Value = wsOrigem.Range("P" & lngLinBD).Value
            
            lngLinCel = lngLinCel - 2
            
            ' Inclui comentário na descrição
            If wsOrigem.Range("W" & lngLinBD).Value <> "" And wsOrigem.Range("AA" & lngLinBD).Value <> "" Then
                
                wsCrono.Unprotect Password:="senhasBNxl"
                
                Set lobjintegra = CreateObject("PreencherEmpreendimento.Integracao")
                Set lobjemp = lobjintegra.IsValido(wsOrigem.Range("AA" & lngLinBD).Value, "0")
                
                If Not lobjemp Is Nothing Then
                    
                    cdSProd = "" & wsOrigem.Range("AB" & lngLinBD).Value
                    
                    With wsCrono.Range("J" & linhaDestinoAux)
                        On Error Resume Next
                        .ClearComments
                        On Error GoTo erroImportaProjetoCronograma
                        
                        .AddComment
                        .Comment.Text Text:= _
                            "Produto = " & lobjemp.produto.descricao & Chr(10) & _
                            "Finalidade = " & lobjemp.Finalidade.descricao & Chr(10) & _
                            "Atividade = " & lobjemp.Atividade.descricao & Chr(10) & _
                            "Modalidade = " & lobjemp.Modalidade.descricao & Chr(10) & _
                            "Variedade = " & lobjemp.variedade.descricao & Chr(10) & _
                            "Cod.Empreendimento = " & lobjemp.codigo & Chr(10) & _
                            "Cod.Sist.Produção = " & cdSProd
                        
                        .Comment.Shape.ScaleHeight 2.3, msoFalse, msoScaleFromTopLeft
                        .Comment.Shape.ScaleWidth 3.1, msoFalse, msoScaleFromTopLeft
                        .Comment.Visible = False
                        
                        .Value = lobjemp.produto.descricao
                    End With
                    
                    wsCrono.Range("BT" & linhaDestinoAux).Value = lobjemp.Finalidade.descricao
                    wsCrono.Range("AC" & linhaDestinoAux).Value = lobjemp.UnidadeMedida.Sigla
                    wsCrono.Range("AD" & linhaDestinoAux).Value = lobjemp.Atividade.descricao
                    wsCrono.Range("BU" & linhaDestinoAux).Value = lobjemp.variedade.descricao
                End If
                
            Else
                If wsOrigem.Range("AA" & lngLinBD).Value = vbNullString Then
                    protPlan.DesprotegePlanilha
                    wsCrono.Range("J" & linhaDestinoAux & ":M" & linhaDestinoAux).ClearContents
                    On Error Resume Next
                    wsCrono.Range("J" & linhaDestinoAux).ClearComments
                    On Error GoTo erroImportaProjetoCronograma
                End If
            End If
            
            wsCrono.Range("Z" & linhaDestinoAux).Value = wsOrigem.Range("AA" & lngLinBD).Value
            wsCrono.Range("AB" & linhaDestinoAux).Value = wsOrigem.Range("AB" & lngLinBD).Value
            wsCrono.Range("AC" & linhaDestinoAux).Value = wsOrigem.Range("Z" & lngLinBD).Value
            
            ' Inclusão de área de apascentamento
            wsCrono.Range("F" & linhaDestinoAux).Value = wsOrigem.Range("AF" & lngLinBD).Value
            
            ' Plano Safra
            If wsOrigem.Range("AE" & lngLinBD).Value = "" Then
                If lngLinBD < 258 Then
                    If wsProp.Range("D" & (lngLinBD - 195)).Value <> "" Then
                        wsCrono.Range("G" & (lngLinBD + 21)).Value = "INVESTIMENTOS FIXOS (1)"
                    Else
                        wsCrono.Range("G" & (lngLinBD + 21)).Value = wsOrigem.Range("AE" & lngLinBD).Value
                    End If
                ElseIf lngLinBD < 260 Then
                    If wsProp.Range("D" & (lngLinBD - 194)).Value <> "" Then
                        wsCrono.Range("G" & (lngLinBD + 21)).Value = "INVESTIMENTOS FIXOS (1)"
                    Else
                        wsCrono.Range("G" & (lngLinBD + 21)).Value = wsOrigem.Range("AE" & lngLinBD).Value
                    End If
                Else
                    If wsProp.Range("D" & (lngLinBD - 191)).Value <> "" Then
                        wsCrono.Range("G" & (lngLinBD + 21)).Value = "INVESTIMENTOS FIXOS (1)"
                    Else
                        wsCrono.Range("G" & (lngLinBD + 21)).Value = wsOrigem.Range("AE" & lngLinBD).Value
                    End If
                End If
            Else
                wsCrono.Range("G" & (lngLinBD + 21)).Value = wsOrigem.Range("AE" & lngLinBD).Value
            End If
            
            ' Inclusão do item MDA e CFI
            wsCrono.Range("L" & (lngLinBD + 21)).Value = wsOrigem.Range("AC" & lngLinBD).Value
            wsCrono.Range("M" & (lngLinBD + 21)).Value = wsOrigem.Range("AD" & lngLinBD).Value
        
        '------------------------------------------------------------
        ' BLOCO ESPECIAL
        ' Correção: além de J129/G281, também atualiza a linha auxiliar
        ' para não deixar J240 sem mudança.
        '------------------------------------------------------------
        Else
            If diferencaLinhas = 129 Then
                wsCrono.Range("J" & linhaDestinoCrono).Value = wsOrigem.Range("E" & lngLinBD).Text
                wsCrono.Range("G" & (lngLinBD + 21)).Value = wsOrigem.Range("AE" & lngLinBD).Value
                
                ' CORREÇÃO:
                ' garantir atualização da linha auxiliar correspondente
                ' Ex.: quando lngLinBD = 260, atualiza J240
                wsCrono.Range("J" & linhaDestinoAux).Value = wsOrigem.Range("E" & lngLinBD).Text
                wsCrono.Range("K" & linhaDestinoAux).Value = wsOrigem.Range("F" & lngLinBD).Text
                wsCrono.Range("L" & linhaDestinoAux).Value = wsOrigem.Range("G" & lngLinBD).Text
                wsCrono.Range("M" & linhaDestinoAux).Value = wsOrigem.Range("H" & lngLinBD).Text
                wsCrono.Range("N" & linhaDestinoAux).Value = wsOrigem.Range("I" & lngLinBD).Text
                
                wsCrono.Range("Z" & linhaDestinoAux).Value = wsOrigem.Range("AA" & lngLinBD).Value
                wsCrono.Range("AB" & linhaDestinoAux).Value = wsOrigem.Range("AB" & lngLinBD).Value
                wsCrono.Range("AC" & linhaDestinoAux).Value = wsOrigem.Range("Z" & lngLinBD).Value
                wsCrono.Range("F" & linhaDestinoAux).Value = wsOrigem.Range("AF" & lngLinBD).Value
                
                ' Se houver estrutura válida, também atualiza comentário e descrição
                If wsOrigem.Range("W" & lngLinBD).Value <> "" And wsOrigem.Range("AA" & lngLinBD).Value <> "" Then
                    
                    wsCrono.Unprotect Password:="senhasBNxl"
                    
                    Set lobjintegra = CreateObject("PreencherEmpreendimento.Integracao")
                    Set lobjemp = lobjintegra.IsValido(wsOrigem.Range("AA" & lngLinBD).Value, "0")
                    
                    If Not lobjemp Is Nothing Then
                        cdSProd = "" & wsOrigem.Range("AB" & lngLinBD).Value
                        
                        With wsCrono.Range("J" & linhaDestinoAux)
                            On Error Resume Next
                            .ClearComments
                            On Error GoTo erroImportaProjetoCronograma
                            
                            .AddComment
                            .Comment.Text Text:= _
                                "Produto = " & lobjemp.produto.descricao & Chr(10) & _
                                "Finalidade = " & lobjemp.Finalidade.descricao & Chr(10) & _
                                "Atividade = " & lobjemp.Atividade.descricao & Chr(10) & _
                                "Modalidade = " & lobjemp.Modalidade.descricao & Chr(10) & _
                                "Variedade = " & lobjemp.variedade.descricao & Chr(10) & _
                                "Cod.Empreendimento = " & lobjemp.codigo & Chr(10) & _
                                "Cod.Sist.Produção = " & cdSProd
                            
                            .Comment.Shape.ScaleHeight 2.3, msoFalse, msoScaleFromTopLeft
                            .Comment.Shape.ScaleWidth 3.1, msoFalse, msoScaleFromTopLeft
                            .Comment.Visible = False
                            .Value = lobjemp.produto.descricao
                        End With
                        
                        wsCrono.Range("BT" & linhaDestinoAux).Value = lobjemp.Finalidade.descricao
                        wsCrono.Range("AC" & linhaDestinoAux).Value = lobjemp.UnidadeMedida.Sigla
                        wsCrono.Range("AD" & linhaDestinoAux).Value = lobjemp.Atividade.descricao
                        wsCrono.Range("BU" & linhaDestinoAux).Value = lobjemp.variedade.descricao
                    End If
                End If
            End If
        End If
        
        Set lobjemp = Nothing
        Set lobjintegra = Nothing
    Next lngLinBD
    
    ' Programa PGPAF
    xl04Crono.Range("J314").Value = wsOrigem.Range("H761").Value
    
    ImportaProjetoCronograma = 1

saidaSegura:
    On Error Resume Next
    
    If Not wsCrono Is Nothing Then
        wsCrono.Protect Password:="senhasBNxl"
    End If
    
    If Not protPlan Is Nothing Then
        protPlan.ProtegePlanilha
        Set protPlan = Nothing
    End If
    
    Set lobjintegra = Nothing
    Set lobjemp = Nothing
    Set wsOrigem = Nothing
    Set wsCrono = Nothing
    Set wsProp = Nothing
    Set wbOrigem = Nothing
    Set wbDestino = Nothing
    
    Application.ScreenUpdating = screenUpdatingAnterior
    Application.EnableEvents = eventosAnterior
    Application.Calculation = calcAnterior
    
    Exit Function

erroImportaProjetoCronograma:
    ImportaProjetoCronograma = -1
    Resume saidaSegura
End Function



'' FIM DE FUNÇÃO





