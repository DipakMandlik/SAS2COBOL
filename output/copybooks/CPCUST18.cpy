000100 * COPYBOOK: CPCUST18 - FOR WORKLIB.CUSTOMER_SALES_SORTED         
000200 01  CUSTOMER-SALES-SORTED-RECORD.                                
000300     05  CUSTOM-CUSTOMER-ID             PIC S9(9) COMP-3.         
000400     05  CUSTOM-CUSTOMER-NAME           PIC X(80).                
000500     05  CUSTOM-SEGMENT                 PIC X(20).                
000600     05  CUSTOM-CUSTOMER-REGION         PIC X(20).                
000700     05  CUSTOM-STATUS                  PIC X(12).                
000800     05  CUSTOM-SALE-ID                 PIC S9(9) COMP-3.         
000900     05  CUSTOM-PRODUCT-ID              PIC S9(9) COMP-3.         
001000     05  CUSTOM-QUANTITY                PIC S9(9)V99 COMP-3.      
001100     05  CUSTOM-UNIT-PRICE              PIC S9(9)V99 COMP-3.      
001200     05  CUSTOM-DISCOUNT-PCT            PIC S9(9)V99 COMP-3.      
001300     05  CUSTOM-GROSS-AMOUNT            PIC S9(9)V99 COMP-3.      
001400     05  CUSTOM-DISCOUNT-AMOUNT         PIC S9(9)V99 COMP-3.      
001500     05  CUSTOM-NET-AMOUNT              PIC S9(9)V99 COMP-3.      
001600     05  CUSTOM-SALE-DATE               PIC 9(8).                 
001700     05  CUSTOM-REGION                  PIC X(20).                
001800     05  CUSTOM-CHANNEL                 PIC X(20).                
