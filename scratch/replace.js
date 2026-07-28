import fs from 'fs';

const filePath = 'src/pages/Documentation.tsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Line numbers are 1-indexed in view_file. Lines 2501 to 2523 (0-indexed 2500 to 2522)
const before = lines.slice(0, 2500).join('\n');
const after = lines.slice(2523).join('\n');

const middle = `                               {status === "aprovado" ? (
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   className="gap-1 rounded-xl text-[11px] font-bold h-8 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 shadow-sm"
                                   disabled={isReadOnly}
                                   onClick={() => handleOpenRejectDialog(file.id)}
                                 >
                                   <Undo2 className="h-3.5 w-3.5" />
                                   Reverter / Reprovar
                                 </Button>
                               ) : status === "reprovado" ? (
                                 <Button
                                   size="sm"
                                   className="gap-1 rounded-xl text-[11px] font-bold h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                   disabled={isReadOnly}
                                   onClick={() => approveDocument(file.id, sub.token.id)}
                                 >
                                   <Undo2 className="h-3.5 w-3.5" />
                                   Reverter / Aprovar
                                 </Button>
                               ) : (
                                 <>
                                   <Button
                                     size="sm"
                                     className="gap-1 rounded-xl text-[11px] font-bold h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                     disabled={isReadOnly}
                                     onClick={() => approveDocument(file.id, sub.token.id)}
                                   >
                                     <ThumbsUp className="h-3.5 w-3.5" />
                                     Aprovar
                                   </Button>
                                   <Button
                                     variant="destructive"
                                     size="sm"
                                     className="gap-1 rounded-xl text-[11px] font-bold h-8 shadow-sm"
                                     disabled={isReadOnly}
                                     onClick={() => handleOpenRejectDialog(file.id)}
                                   >
                                     <ThumbsDown className="h-3.5 w-3.5" />
                                     {isDispensado ? "Reprovar Dispensa" : "Reprovar"}
                                   </Button>
                                 </>
                               )}`;

fs.writeFileSync(filePath, `${before}\n${middle}\n${after}`, 'utf8');
console.log('REPLACED_BY_INDEX_OK');
