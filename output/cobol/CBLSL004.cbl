000100 IDENTIFICATION DIVISION.                                         
000200 PROGRAM-ID. CBLSL004.                                            
000300 AUTHOR. MAINFRAME ARCHITECT - SAS MIGRATION PLATFORM.            
000400 ENVIRONMENT DIVISION.                                            
000500 CONFIGURATION SECTION.                                           
000600 SOURCE-COMPUTER. IBM-ZOS.                                        
000700 OBJECT-COMPUTER. IBM-ZOS.                                        
000800 INPUT-OUTPUT SECTION.                                            
000900 FILE-CONTROL.                                                    
001000     SELECT IN-FILE ASSIGN TO INFILE                              
001100         FILE STATUS IS WS-IN-STATUS.                             
001200     SELECT OUT-FILE ASSIGN TO OUTFILE                            
001300         FILE STATUS IS WS-OUT-STATUS.                            
001400 DATA DIVISION.                                                   
001500 FILE SECTION.                                                    
001600 FD  IN-FILE.                                                     
001700 01  IN-RECORD PIC X(256).                                        
001800 FD  OUT-FILE.                                                    
001900 01  OUT-RECORD PIC X(256).                                       
002000 WORKING-STORAGE SECTION.                                         
002100 01  WS-IN-STATUS PIC X(2) VALUE '00'.                            
002200     88 WS-IN-OK VALUE '00'.                                      
002300     88 WS-IN-EOF VALUE '10'.                                     
002400 01  WS-OUT-STATUS PIC X(2) VALUE '00'.                           
002500     88 WS-OUT-OK VALUE '00'.                                     
002600 01  WS-COUNTERS.                                                 
002700         05 WS-READ-CNT PIC S9(9) COMP-3 VALUE ZERO.              
002800         05 WS-WRITE-CNT PIC S9(9) COMP-3 VALUE ZERO.             
002900         05 WS-CALC-VAL PIC S9(13)V99 COMP-3 VALUE ZERO.          
003000     COPY CPCOMM01.                                               
003100     COPY CPTRAP88.                                               
003200     COPY CPENRS01.                                               
003300     COPY CPRULE01.                                               
003400     COPY CPREVQ01.                                               
003500     COPY CPCATSUM.                                               
003600     COPY CPSUBCAT.                                               
003700 PROCEDURE DIVISION.                                              
003800 0000-MAIN-LINE.                                                  
003900     PERFORM 1000-INITIALIZE.                                     
004000     PERFORM 2000-PROCESS-DATA UNTIL WS-IN-EOF.                   
004100     PERFORM 3000-TERMINATE.                                      
004200     STOP RUN.                                                    
004300 1000-INITIALIZE.                                                 
004400     OPEN INPUT IN-FILE.                                          
004500     PERFORM 9000-CHECK-IN-STATUS.                                
004600     OPEN OUTPUT OUT-FILE.                                        
004700     PERFORM 9100-CHECK-OUT-STATUS.                               
004800     PERFORM 2100-READ-IN-FILE.                                   
004900 2000-PROCESS-DATA.                                               
005000     IF STR-IS-PRESENT THEN                                       
005100         MOVE IN-RECORD TO OUT-RECORD                             
005200         ADD 1 TO WS-WRITE-CNT                                    
005300             ON SIZE ERROR DISPLAY 'WRITE COUNTER OVERFLOW'       
005400         WRITE OUT-RECORD                                         
005500         PERFORM 9100-CHECK-OUT-STATUS                            
005600     END-IF.                                                      
005700     PERFORM 2100-READ-IN-FILE.                                   
005800 2100-READ-IN-FILE.                                               
005900     READ IN-FILE                                                 
006000         AT END SET WS-IN-EOF TO TRUE                             
006100         NOT AT END ADD 1 TO WS-READ-CNT                          
006200             ON SIZE ERROR DISPLAY 'READ COUNTER OVERFLOW'        
006300     END-READ.                                                    
006400     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
006500         PERFORM 9000-CHECK-IN-STATUS                             
006600     END-IF.                                                      
006700 3000-TERMINATE.                                                  
006800     CLOSE IN-FILE.                                               
006900     PERFORM 9000-CHECK-IN-STATUS.                                
007000     CLOSE OUT-FILE.                                              
007100     PERFORM 9100-CHECK-OUT-STATUS.                               
007200     DISPLAY 'CBLSL004 COMPLETED. READ: ' WS-READ-CNT ' WRITE: ' WS-WRITE-CNT.
007300 9000-CHECK-IN-STATUS.                                            
007400     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
007500         DISPLAY 'FATAL ERROR ON IN-FILE STATUS: ' WS-IN-STATUS   
007600         MOVE 16 TO RETURN-CODE                                   
007700         STOP RUN                                                 
007800     END-IF.                                                      
007900 9100-CHECK-OUT-STATUS.                                           
008000     IF NOT WS-OUT-OK THEN                                        
008100         DISPLAY 'FATAL ERROR ON OUT-FILE STATUS: ' WS-OUT-STATUS 
008200         MOVE 16 TO RETURN-CODE                                   
008300         STOP RUN                                                 
008400     END-IF.                                                      
