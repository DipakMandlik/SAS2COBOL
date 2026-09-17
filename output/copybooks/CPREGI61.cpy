000100 * COPYBOOK: CPREGI61 - FOR WORKLIB.REGION_RUNNING_SALES          
000200 01  REGION-RUNNING-SALES-RECORD.                                 
000300     05  REGION-REGION                  PIC X(20).                
000400     05  REGION-SALE-DATE               PIC 9(8).                 
000500     05  REGION-RUNNING-SALES           PIC S9(9)V99 COMP-3.      
000600     05  REGION-RUNNING-UNITS           PIC S9(9) COMP-3.         
000700     05  REGION-PREVIOUS-SALES          PIC S9(9)V99 COMP-3.      
000800     05  REGION-SALES-CHANGE            PIC S9(9)V99 COMP-3.      
