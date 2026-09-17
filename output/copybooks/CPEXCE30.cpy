000100 * COPYBOOK: CPEXCE30 - FOR WORKLIB.EXCEPTION_EXTRACT             
000200 01  EXCEPTION-EXTRACT-RECORD.                                    
000300     05  EXCEPT-SALE-ID                 PIC S9(9) COMP-3.         
000400     05  EXCEPT-CUSTOMER-ID             PIC S9(9) COMP-3.         
000500     05  EXCEPT-NET-AMOUNT              PIC S9(9)V99 COMP-3.      
000600     05  EXCEPT-EXCEPTION-FLAG          PIC X(1).                 
000700     05  EXCEPT-EXCEPTION-CODE          PIC X(20).                
000800     05  EXCEPT-EXCEPTION-SEVERITY      PIC S9(9)V99 COMP-3.      
