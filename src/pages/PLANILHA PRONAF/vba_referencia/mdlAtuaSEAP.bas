Attribute VB_Name = "mdlAtuaSEAP"
Private Sub prepararDadosCulturaAgricola()
Attribute prepararDadosCulturaAgricola.VB_Description = "Macro gravada em 02/07/2009 por Banco do Nordeste S.A"
Attribute prepararDadosCulturaAgricola.VB_ProcData.VB_Invoke_Func = " \n14"
'
' T033CANU
'
'
'
    Dim llngLinhaAtv As Long
    Dim llngLinhaAnos As Long
    Dim llngColArHec As Long
    Dim llngColProCulAgc As Long
    Dim llngLinArHec As Long
    Dim llngLinProCulAgc As Long
    Dim protPlan As New clsProtecao
    
    protPlan.IniciaRotina False
    llngLinArHec = 8
    llngLinProCulAgc = 85
    
    Range("EJ100").Select
    For llngLinhaAtv = 100 To 184
        llngColArHec = 5
        llngColProCulAgc = 11
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaLocal = "=" & Cells(llngLinhaAtv, "DW").Address
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(RC[-1]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-2]="""","""",'Ativ. Agrícola'!" & _
                                                    "R" & llngLinArHec & _
                                                    "C" & llngColArHec & ")"
            If llngLinProCulAgc <= 119 Then
                ActiveCell.Offset(0, 3).FormulaR1C1 = "=IF(RC[-3]="""","""",'Ativ. Agrícola'!" & _
                                                    "R" & llngLinProCulAgc & _
                                                    "C" & llngColProCulAgc & ")"
            Else
                ActiveCell.Offset(0, 3).FormulaR1C1 = 0
            End If
            ActiveCell.Offset(1, 0).Select
            llngColArHec = llngColArHec + 2
            llngColProCulAgc = llngColProCulAgc + 1
        Next llngLinhaAnos
        llngLinArHec = llngLinArHec + 1
        llngLinProCulAgc = llngLinProCulAgc + 1
        If llngLinhaAtv = 134 Then
            llngLinhaAtv = 149
            llngLinArHec = 44
            
        End If
    Next llngLinhaAtv
    protPlan.FinalizaRotina
End Sub

Private Sub prepararDadosCustosAnual()
'
' T033CDAN
'
'
'
    Dim llngLinhaAtv As Long
    Dim llngLinhaAnos As Long
    Dim llngLinVrUni As Long
    Dim llngColVrUni As Long
    Dim protPlan As New clsProtecao
    
    protPlan.IniciaRotina False
    Range("HK100").Select
    'Ativ. Agricola
    llngLinVrUni = 67
    For llngLinhaAtv = 100 To 134

        llngColVrUni = 3
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaR1C1 = "=IF(OR(R" & llngLinhaAtv & _
                                    "C127="""",RC[3]<=0),"""",R" & llngLinhaAtv & "C127)"
            
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(RC[-1]="""","""",1)"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-1]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 3).FormulaR1C1 = "=Tabelas!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni
            
            llngColVrUni = llngColVrUni + 1
            ActiveCell.Offset(1, 0).Select
        Next llngLinhaAnos
        llngLinVrUni = llngLinVrUni + 1
    Next llngLinhaAtv
    
    'Ativ. Pecuaria
    llngLinVrUni = 292
    For llngLinhaAtv = 135 To 138
        llngColVrUni = 3
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaR1C1 = "=IF(OR(R" & llngLinhaAtv & _
                                    "C127="""",RC[3]<=0),"""",R" & llngLinhaAtv & "C127)"
            
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(RC[-1]="""","""",1)"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-1]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 3).FormulaR1C1 = "=Tabelas!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni
            
            llngColVrUni = llngColVrUni + 1
            ActiveCell.Offset(1, 0).Select
        Next llngLinhaAnos
        llngLinVrUni = llngLinVrUni + 10
    Next llngLinhaAtv
    
    'Outras Ativ.
    llngLinVrUni = 46
    For llngLinhaAtv = 139 To 149
        llngColVrUni = 6
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaR1C1 = "=IF(OR(R" & llngLinhaAtv & _
                                    "C127="""",RC[3]<=0),"""",R" & llngLinhaAtv & "C127)"
            
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(RC[-1]="""","""",1)"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-1]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 3).FormulaR1C1 = "='Outras Ativ'!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni
            
            
               
            llngColVrUni = llngColVrUni + 1
            ActiveCell.Offset(1, 0).Select
        Next llngLinhaAnos
        llngLinVrUni = llngLinVrUni + 1
    Next llngLinhaAtv
    
    'Pastagens
    llngLinVrUni = 147
    For llngLinhaAtv = 150 To 184
        llngColVrUni = 3
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaR1C1 = "=IF(OR(R" & llngLinhaAtv & _
                                    "C127="""",RC[3]<=0),"""",R" & llngLinhaAtv & "C127)"
            
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(RC[-1]="""","""",1)"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-1]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 3).FormulaR1C1 = "=Tabelas!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni
            
            llngColVrUni = llngColVrUni + 1
            ActiveCell.Offset(1, 0).Select
        Next llngLinhaAnos
        llngLinVrUni = llngLinVrUni + 1
    Next llngLinhaAtv
    
    'Outras despesas
    llngLinVrUni = 335
    For llngLinhaAtv = 185 To 185
        llngColVrUni = 3
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaR1C1 = "=IF(OR(R" & llngLinhaAtv & _
                                    "C127="""",RC[3]<=0),"""",R" & llngLinhaAtv & "C127)"
            
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(RC[-1]="""","""",1)"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-1]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 3).FormulaR1C1 = "=Tabelas!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni
            
            llngColVrUni = llngColVrUni + 1
            ActiveCell.Offset(1, 0).Select
        Next llngLinhaAnos
        llngLinVrUni = llngLinVrUni + 1
    Next llngLinhaAtv
    
    protPlan.FinalizaRotina
    Set protPlan = Nothing
    
End Sub


Private Sub prepararDadosProducaoAnual()
'
' T033PANU
'
'
'
    Dim llngLinhaAtv As Long
    Dim llngLinhaAnos As Long
    Dim llngLinVrUni As Long
    Dim llngColVrUni As Long
    Dim protPlan As New clsProtecao
    
    protPlan.IniciaRotina False
    Range("IG100").Select
    'Ativ. Agricola
    llngLinVrUni = 85
    For llngLinhaAtv = 100 To 134

        llngColVrUni = 11
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaR1C1 = "=IF(OR(R" & llngLinhaAtv & _
                                    "C127="""",RC[4]<=0),"""",R" & llngLinhaAtv & "C127)"
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(R" & llngLinhaAtv & "C203="""","""",1)"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-2]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 3).FormulaR1C1 = "=IF('Ativ. Agrícola'!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni & _
                                                    " > 0,'Ativ. Agrícola'!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni & ",0)"
            ActiveCell.Offset(0, 4).FormulaR1C1 = "='Ativ. Agrícola'!R" & llngLinVrUni & "C9"
        
            llngColVrUni = llngColVrUni + 1
            ActiveCell.Offset(1, 0).Select
        Next llngLinhaAnos
        llngLinVrUni = llngLinVrUni + 1
    Next llngLinhaAtv
    
    'Ativ. Pecuaria
    llngLinVrUni = 289
    For llngLinhaAtv = 135 To 138
        llngColVrUni = 3
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaR1C1 = "=IF(OR(R" & llngLinhaAtv & _
                                    "C127="""",RC[4]<=0),"""",R" & llngLinhaAtv & "C127)"
            
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(R" & llngLinhaAtv & "C203="""","""",1)"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-2]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 3).FormulaR1C1 = "=IF(RC[1] > 0,1,"""")"
            ActiveCell.Offset(0, 4).FormulaR1C1 = "=Tabelas!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni
            
            llngColVrUni = llngColVrUni + 1
            ActiveCell.Offset(1, 0).Select
        Next llngLinhaAnos
        llngLinVrUni = llngLinVrUni + 10
    Next llngLinhaAtv
    
    'Outras Ativ.
    llngLinVrUni = 15
    For llngLinhaAtv = 139 To 148
        llngColVrUni = 6
        For llngLinhaAnos = 0 To 30
            ActiveCell.FormulaR1C1 = "=IF(OR(R" & llngLinhaAtv & _
                                    "C127="""",RC[4]<=0),"""",R" & llngLinhaAtv & "C127)"
            
            ActiveCell.Offset(0, 1).FormulaR1C1 = "=IF(R" & llngLinhaAtv & "C203="""","""",1)"
            ActiveCell.Offset(0, 2).FormulaR1C1 = "=IF(RC[-2]="""",""""," & llngLinhaAnos & ")"
            ActiveCell.Offset(0, 3).FormulaR1C1 = "=IF(RC[1] > 0,1,"""")"
            ActiveCell.Offset(0, 4).FormulaR1C1 = "='Outras Ativ'!R" & llngLinVrUni & _
                                                    "C" & llngColVrUni
            
            llngColVrUni = llngColVrUni + 1
            ActiveCell.Offset(1, 0).Select
        Next llngLinhaAnos
        llngLinVrUni = llngLinVrUni + 1
    Next llngLinhaAtv
    
    
    protPlan.FinalizaRotina
           
    Set protPlan = Nothing
End Sub




