000100 * COPYBOOK: CPSALE67 - FOR WORKLIB.SALES_BASE                    
000200 01  SALES-BASE-RECORD.                                           
000300     05  SALES-SALE-ID                  PIC S9(9) COMP-3.         
000400     05  SALES-CUSTOMER-ID              PIC S9(9) COMP-3.         
000500     05  SALES-PRODUCT-ID               PIC S9(9) COMP-3.         
000600     05  SALES-QUANTITY                 PIC S9(9)V99 COMP-3.      
000700     05  SALES-UNIT-PRICE               PIC S9(9)V99 COMP-3.      
000800     05  SALES-DISCOUNT-PCT             PIC S9(9)V99 COMP-3.      
000900     05  SALES-GROSS-AMOUNT             PIC S9(9)V99 COMP-3.      
001000     05  SALES-DISCOUNT-AMOUNT          PIC S9(9)V99 COMP-3.      
001100     05  SALES-NET-AMOUNT               PIC S9(9)V99 COMP-3.      
001200     05  SALES-SALE-DATE                PIC 9(8).                 
001300     05  SALES-REGION                   PIC X(20).                
001400     05  SALES-CHANNEL                  PIC X(20).                
