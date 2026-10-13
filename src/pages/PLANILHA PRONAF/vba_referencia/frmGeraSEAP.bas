Attribute VB_Name = "frmGeraSEAP"
Attribute VB_Base = "0{CB917B9A-0072-41D9-8A50-3F571EC85DF2}{8323B72D-13BF-4C8E-AC26-D9B2E0973D8D}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False


'Formulário chamado no procedimento de geração de arquivo para importação pelo SEAP
'Valida as inconsistencias cadastradas - visaoCRITICA -
'Contabiliza os avisos e erros
'Impede a geração do arquivo caso sejam encontrados erros

'Gera o arquivo a ser importado pelo SEAP
'' Joris dia 22.04.2026
'' superar o erro que está dando quando o analisador PRONAF A
'' está aberto essa macro não funciona.

Private Sub btnGeraSEAP_Click()

    Dim xlInvRural As String
    Dim strFiltro As String
    Dim xlArqExp As String
    Dim xlArqSEAP As String
    Dim flagArquivo As Boolean
    
    Dim xlArquivo As Variant
    Dim xlPlan As Worksheet
    
    Dim sb As clsProgressBar
    Dim protPlan As clsProtecao
    
    Dim wbOrigem As Workbook
    Dim wbDestino As Workbook
    Dim wsOrigem As Worksheet
    Dim wsDestino As Worksheet
    
    On Error GoTo erroExportaProjeto
    
    Set protPlan = New clsProtecao
    Set sb = New clsProgressBar
    
    'IMPORTANTE:
    'Usa ThisWorkbook para garantir que o código trabalhe sempre com a pasta correta,
    'mesmo que outra pasta esteja aberta ou ativa no Excel 16.
    Set wbOrigem = ThisWorkbook
    
    CarregamentoRapido True
    Call Limpar_Geodesica '25/11/2020
    Grava_GeodesicaSEAP
    Grava_SICORSEAP 'Gravar os dados da Aba Sicor para transferencia SEAP. Ricardo 18/08/2021
    
    wbOrigem.Activate
    xl00Menu.Activate
    
    xlInvRural = wbOrigem.Name
    flagArquivo = False
    Boorel = True
    
    strFiltro = "Arquivo de exportação SEAP (*.SEAP),*.SEAP"
    
    Do While Not flagArquivo
        xlArquivo = Application.GetSaveAsFilename( _
                        InitialFileName:="", _
                        fileFilter:=strFiltro, _
                        Title:=":: Planilha PRONAF A2 - Informe o nome do arquivo de dados")
        
        If VarType(xlArquivo) = vbBoolean Then
            If xlArquivo = False Then Exit Do
        End If
        
        If ExisteArquivo(CStr(xlArquivo)) Then
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
        CarregamentoRapido False
        Exit Sub
    End If
    
    CarregamentoRapido True
    protPlan.IniciaRotina False
    
    xlArqSEAP = CStr(xlArquivo)
    xlArqExp = Replace(UCase$(xlArqSEAP), ".SEAP", ".XLS")
    xlArqExp = StrConv(xlArqExp, vbProperCase)
    
    If ExisteArquivo(xlArqExp) Then Kill xlArqExp
    If ExisteArquivo(xlArqSEAP) Then Kill xlArqSEAP
    
    sb.Show "Gerando arquivo de dados ", vbNullString, 1
    sb.PercentComplete = 50
    
    'Cria workbook de exportação
    Set wbDestino = Workbooks.Add
    
    If Int(Val(Application.Version)) >= 11 Then
        wbDestino.SaveAs Filename:=xlArqExp, Password:="PSNBN009", FileFormat:=xlExcel8
    Else
        wbDestino.SaveAs Filename:=xlArqExp, Password:="PSNBN009", FileFormat:=xlNormal
    End If
    
    Application.DisplayAlerts = False
    
    Set wsDestino = wbDestino.Worksheets(1)
    wsDestino.Name = "SEAP"
    
    For Each xlPlan In wbDestino.Worksheets
        If xlPlan.Name <> "SEAP" Then
            xlPlan.Delete
        End If
    Next xlPlan
    
    Application.DisplayAlerts = True
    
    CarregamentoRapido True
    
    Call InserirFormulasGleba(101)
    
    'Planilha de origem
    Set wsOrigem = wbOrigem.Worksheets("SEAP")
    
    sb.Show "Gerando arquivo de dados ", vbNullString, 80
    Application.ScreenUpdating = False
    
    'Copia conteúdo da SEAP da pasta de origem para a pasta destino
    wsOrigem.Cells.Copy
    wsDestino.Range("A1").PasteSpecial Paste:=xlValues, Operation:=xlNone, SkipBlanks:=False, Transpose:=False
    wsDestino.Range("A1").PasteSpecial Paste:=xlFormats
    Application.CutCopyMode = False
    
    sb.Show "Gerando arquivo de dados ", vbNullString, 88
    
    wbDestino.Close SaveChanges:=True
    
    sb.Show "Gerando arquivo de dados ", vbNullString, 95
    
    'Renomeia o arquivo .XLS para .SEAP
    Name xlArqExp As xlArqSEAP
    
    protPlan.ProtegePlanilha
    
    wbOrigem.Activate
    xl00Menu.Activate
    
    sb.PercentComplete = 100
    MsgBox "Arquivo Gerado" & vbCrLf & xlArqSEAP, vbInformation
    
    Application.EnableCancelKey = xlInterrupt
    protPlan.FinalizaRotina
    CarregamentoRapido False
    Application.ScreenUpdating = True
    
    Set wsOrigem = Nothing
    Set wsDestino = Nothing
    Set wbDestino = Nothing
    Set wbOrigem = Nothing
    Set protPlan = Nothing
    Set sb = Nothing
    
    Exit Sub

erroExportaProjeto:
    MsgBox "Ocorreu um erro durante o processo" & vbCrLf & Err.Description, vbExclamation
    
    On Error Resume Next
    
    Boorel = False
    
    If Not wbOrigem Is Nothing Then
        wbOrigem.Activate
    End If
    
    xl00Menu.Activate
    Application.EnableCancelKey = xlInterrupt
    Application.ScreenUpdating = True
    
    If Not protPlan Is Nothing Then
        protPlan.FinalizaRotina
    End If
    
    CarregamentoRapido False
    
    Set wsOrigem = Nothing
    Set wsDestino = Nothing
    Set wbDestino = Nothing
    Set wbOrigem = Nothing
    Set protPlan = Nothing
    Set sb = Nothing
End Sub

'Opção par emitir o relatório de críticas
Private Sub btnRelatorio_Click()
        Dim strPlan As String
        Dim protPlan As clsProtecao
        Set protPlan = New clsProtecao
        protPlan.FinalizaRotina
        strPlan = ActiveSheet.Name
        Me.Hide
        protPlan.IniciaRotina True
        xl00Critica.Activate
        Application.Dialogs(xlDialogPrint).Show
        Sheets([strPlan]).Activate
        protPlan.FinalizaRotina
        Set protPlan = Nothing
        Application.ScreenUpdating = True
        Me.Show
End Sub

Private Sub btnRetornar_Click()
        Unload Me
End Sub


'chama função criticaprojeto para validar mensagens de erros e alertas
Private Sub UserForm_Initialize()
        lngMsgAvisos = 0
        lngMsgErros = 0
        'AtualizaCoordenadas
        CarregamentoRapido True
        ' RTC 1207004 CargaIniGeodesica
        Sheets("Menu").Activate
        'CarregamentoRapido False
        If CriticaProjeto Then
           If lngMsgAvisos > 0 Then
              lblAlerta.Caption = lngMsgAvisos & " Mensagem(ns) de aviso."
           Else
              lblAlerta.Visible = False
           End If
           If lngMsgErros > 0 Then
              lblErro.Caption = lngMsgErros & " Mensagem(ns) de erro."
              btnGeraSEAP.Enabled = False
           Else
              lblErro.Visible = False
           End If
           Me.Show
        Else
            btnGeraSEAP_Click
            Unload Me
        End If
End Sub

Private Sub UserForm_Terminate()
        Dim protPlan As clsProtecao
        Set protPlan = New clsProtecao
        xl00Menu.Activate
        protPlan.IniciaRotina False
        xl00Critica.Activate
        Application.Dialogs(xlDialogPrint).Show
        protPlan.DesprotegePlanilha
        Range("B12:E1000").Font.Bold = False
        Range("B12:E1000").ClearContents
        protPlan.ProtegePlanilha
        xl00Menu.Activate
        protPlan.FinalizaRotina
        Set protPlan = Nothing
End Sub

Private Sub Grava_SICORSEAP()
'---- Planilha SEAP ----
Dim protPlan As clsProtecao
Set protPlan = New clsProtecao
Sheets("SEAP").Activate
protPlan.IniciaRotina False

'SICOR 18/08/2021 INICIO - GERAR DADOS SICOR
Dim li_descricao, li_inv, li_it_inv, li_ini_exp, li_contador, li_perc_cb As Integer
Dim ls_descricao, ls_desc_item As String
Dim ldb_perc_enr_ren As Double


    'Limpar região de exportação
    SEAP.Range("C2002:I2868").ClearContents
    li_contador = 4
    li_descricao = 4 'Somar sempre mais 24 linhas que é o total por inversão q são no máximo 20 linhas
    li_ini_exp = 2002
    li_it_inv = 4
   
    Do While li_contador <= 868
      If xlSicor.Range("A" & [li_contador]).Value = "A" Then
         If xlSicor.Range("D" & [li_contador]).Value <> "" Then
           ls_descricao = xlSicor.Range("D" & [li_contador]).Value
           ldb_perc_enr_ren = xlSicor.Range("E" & [li_contador] + 1).Value
           li_contador = li_contador + 2
         Else
           If xlSicor.Range("B" & [li_contador]).Value <> "" Then
                SEAP.Range("C" & [li_ini_exp]).Value = xlSicor.Range("X" & [li_contador]).Value 'Sequencial
                SEAP.Range("D" & [li_ini_exp]).Value = ls_descricao                         'Descrição da Inversão
                SEAP.Range("E" & [li_ini_exp]).Value = xlSicor.Range("C" & [li_contador]).Value 'Código de Certificação Orgânica
                SEAP.Range("F" & [li_ini_exp]).Value = xlSicor.Range("E" & [li_contador]).Value 'URL da Certificação Orgânica
                SEAP.Range("G" & [li_ini_exp]).Value = xlSicor.Range("G" & [li_contador]).Value 'Código de Rastreabilidade
                SEAP.Range("H" & [li_ini_exp]).Value = xlSicor.Range("I" & [li_contador]).Value 'URL da Certificação de Rastreabilidade
                SEAP.Range("I" & [li_ini_exp]).Value = ldb_perc_enr_ren                     'Percentual de Energia Renovável.
                li_ini_exp = li_ini_exp + 1
           End If
         End If
      End If
      li_contador = li_contador + 1
    Loop
    

    Dim ll_PER, ll_salto, ll_ini_per, ll_seq As Long 'PER = Percentual de Energia Renovável Ricardo 27/08/2021
    ll_salto = 5 'Inicio da primeira linha de percentual de Energia Renovável da ABA SICOR
    SEAP.Range("IO100:IO135").ClearContents
    ll_ini_per = 100 'Inicio da primeira linha para gravar em sequencia todas os percentuais de energia renovavel
    'Gravar dados de percentual de Energia Renovável Ricardo 24/08/2021 Inicio
    For ll_PER = 1 To 36
        ldb_perc_enr_ren = xlSicor.Range("E" & [ll_salto]).Value   'Valor de Percentual de energia Renovável
        ll_seq = xlSicor.Range("B" & [ll_salto]).Value  'Valor de Percentual de energia Renovável
        If Len(ldb_perc_enr_ren) > 0 Then
           SEAP.Range("IO" & [ll_ini_per]).Value = ldb_perc_enr_ren                 'Percentual de Energia Renovável.
        End If
        ll_salto = ll_salto + 24
        ll_ini_per = ll_ini_per + 1
    Next
    'Gravar dados de percentual de Energia Renovável Ricardo 24/08/2021 Final
    
    protPlan.FinalizaRotina
    Set protPlan = Nothing
    'SICOR   16/08/2021 FINAL
    
    'SICOR 16/08/2021 FINAL  - GERAR DADOS SICOR
End Sub
'
'
Private Sub Grava_GeodesicaSEAP()
'---- Planilha SEAP ----
    Dim protPlan As clsProtecao
    Set protPlan = New clsProtecao
    
   'Limpar as Glebas que não possuem Inversões
    xl00Visao.Calculate
    For L_Inv = 11 To 46
       If xl00Visao.Range("GX" & [L_Inv]).Value = "-1" Then
         'Excluir se houver
            For i = 101 To bd10Geodesica.Range("BJ99").Value + 100
               If bd10Geodesica.Range("BA" & i).Value = CInt(xl00Visao.Range("GO" & [L_Inv]).Value) Then
                  ExcluirGleba bd10Geodesica.Range("BG" & i).Value, bd10Geodesica.Range("BH" & i).Value, CInt(i)
                  'Call OrdenarListaGleba
                  Call InserirResumoGleba
                  Call OrdenarResumoGleba
               End If
            Next i
           'LimparGlebaPontos xl00Visao.Range("GO" & [L_Inv]).Value, 0
       End If
    Next L_Inv
    
    Sheets("SEAP").Activate
    protPlan.IniciaRotina False
    'COORDENADAS GEODESICAS  RNM - GSOL00969220 18/01/2016
    'Alocar a informação de Glebas de Inversões
    Range("BT202:CB" & Rows.Count).ClearContents
   'Formato definitivo para exibir o Listbox das Glebas e Pontos
    Columns("BT:BT").Select
    Selection.NumberFormat = "00"
    Columns("BU:BU").Select
    Selection.NumberFormat = "00"
    Columns("BW:BW").Select
    Selection.NumberFormat = "#,##0.00"
    Columns("BX:BX").Select
    Selection.NumberFormat = "00"
    Columns("BY:BY").Select
    Selection.NumberFormat = "#0.000000;[Red]-#0.00000000000"
    Columns("BZ:BZ").Select
    Selection.NumberFormat = "##0.000000;[Red]-##0.00000000000"
    Columns("CA:CA").Select
    Selection.NumberFormat = "#,##0.00;[Red]-#,##0.00"              ' INCLUSÃO
        
    lngLinBD = 202
    lngLinSel = 101
    Do While lngLinSel <= bd10Geodesica.Range("B99").Value + 100
       Range("BT" & [lngLinBD]).Value = bd10Geodesica.Range("C" & [lngLinSel]).Value  ' SQ_INV
       Range("BU" & [lngLinBD]).Value = bd10Geodesica.Range("F" & [lngLinSel]).Value  ' CD_GLB
       Range("BV" & [lngLinBD]).Value = bd10Geodesica.Range("N" & [lngLinSel]).Value  ' TP_GLB
       Range("BW" & [lngLinBD]).Value = bd10Geodesica.Range("H" & [lngLinSel]).Value  ' AR_NAO_CUL
       Range("BX" & [lngLinBD]).Value = bd10Geodesica.Range("I" & [lngLinSel]).Value  ' SQ_COO_GLE
       Range("BY" & [lngLinBD]).Value = bd10Geodesica.Range("J" & [lngLinSel]).Value  ' VR_LAT
       Range("BZ" & [lngLinBD]).Value = bd10Geodesica.Range("K" & [lngLinSel]).Value  ' VR_LGT
       Range("CA" & [lngLinBD]).Value = bd10Geodesica.Range("L" & [lngLinSel]).Value  ' VR_ALT
       Range("CB" & [lngLinBD]).Value = bd10Geodesica.Range("T" & [lngLinSel]).Value  ' Flag_Status_Gleba
       lngLinSel = lngLinSel + 1
       lngLinBD = lngLinBD + 1
    Loop
    Range("BT201").Value = "SQ_IVS"
    Range("BU201").Value = "CD_GLB"
    Range("BV201").Value = "TP_GLB"
    Range("BW201").Value = "AR_NAO_CUL"
    Range("BX201").Value = "SQ_COO_GLE"
    Range("BY201").Value = "VR_LAT"
    Range("BZ201").Value = "VR_LGT"
    Range("CA201").Value = "VR_ALT"
    Range("CB201").Value = "ST_EDC_GLB"
    
    Sheets("SEAP").Visible = xlSheetVeryHidden
    
    'TÉRMINO DE COORDENADAS
    'COORDENADAS GEODESICAS  RNM - GSOL00969220 18/01/2016
    protPlan.FinalizaRotina
    Set protPlan = Nothing
End Sub
