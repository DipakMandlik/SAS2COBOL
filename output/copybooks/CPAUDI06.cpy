000100 * COPYBOOK: CPAUDI06 - FOR WORKLIB.AUDIT_EXTRACT                 
000200 01  AUDIT-EXTRACT-RECORD.                                        
000300     05  AUDIT-CUSTOMER-REGION          PIC X(20).                
000400     05  AUDIT-TRANSACTIONS             PIC S9(9)V99 COMP-3.      
000500     05  AUDIT-SALES                    PIC S9(9)V99 COMP-3.      
000600     05  AUDIT-AVERAGE-SALE             PIC S9(9)V99 COMP-3.      
000700     05  AUDIT-UNITS                    PIC S9(9)V99 COMP-3.      
000800     05  AUDIT-AUDIT-TIMESTAMP          PIC S9(9)V99 COMP-3.      
000900     05  AUDIT-AUDIT-SOURCE             PIC X(30).                
