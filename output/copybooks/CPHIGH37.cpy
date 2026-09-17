000100 * COPYBOOK: CPHIGH37 - FOR WORKLIB.HIGH_VALUE_SALES              
000200 01  HIGH-VALUE-SALES-RECORD.                                     
000300     05  HIGHV-SALE-ID                  PIC S9(9) COMP-3.         
000400     05  HIGHV-SALE-DATE                PIC 9(8).                 
000500     05  HIGHV-CUSTOMER-ID              PIC S9(9) COMP-3.         
000600     05  HIGHV-CUSTOMER-NAME            PIC X(80).                
000700     05  HIGHV-SEGMENT                  PIC X(20).                
000800     05  HIGHV-CUSTOMER-REGION          PIC X(20).                
000900     05  HIGHV-PRODUCT-ID               PIC S9(9) COMP-3.         
001000     05  HIGHV-PRODUCT-NAME             PIC X(100).               
001100     05  HIGHV-CATEGORY                 PIC X(40).                
001200     05  HIGHV-SUBCATEGORY              PIC X(40).                
001300     05  HIGHV-QUANTITY                 PIC S9(9)V99 COMP-3.      
001400     05  HIGHV-UNIT-PRICE               PIC S9(9)V99 COMP-3.      
001500     05  HIGHV-DISCOUNT-PCT             PIC S9(9)V99 COMP-3.      
001600     05  HIGHV-GROSS-AMOUNT             PIC S9(9)V99 COMP-3.      
001700     05  HIGHV-DISCOUNT-AMOUNT          PIC S9(9)V99 COMP-3.      
001800     05  HIGHV-NET-AMOUNT               PIC S9(9)V99 COMP-3.      
001900     05  HIGHV-VALUE-BAND               PIC X(10).                
002000     05  HIGHV-PRICING-BAND             PIC X(12).                
