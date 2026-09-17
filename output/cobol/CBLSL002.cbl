000100 IDENTIFICATION DIVISION.                                         
000200 PROGRAM-ID. CBLSL002.                                            
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
003200     COPY CPCUST02.                                               
003300     COPY CPSALE02.                                               
003400     COPY CPCSAL01.                                               
003500     COPY CPCMON01.                                               
003600 PROCEDURE DIVISION.                                              
003700 0000-MAIN-LINE.                                                  
003800     PERFORM 1000-INITIALIZE.                                     
003900     PERFORM 2000-PROCESS-DATA UNTIL WS-IN-EOF.                   
004000     PERFORM 3000-TERMINATE.                                      
004100     STOP RUN.                                                    
004200 1000-INITIALIZE.                                                 
004300     OPEN INPUT IN-FILE.                                          
004400     PERFORM 9000-CHECK-IN-STATUS.                                
004500     OPEN OUTPUT OUT-FILE.                                        
004600     PERFORM 9100-CHECK-OUT-STATUS.                               
004700     PERFORM 2100-READ-IN-FILE.                                   
004800 2000-PROCESS-DATA.                                               
004900     IF STR-IS-PRESENT THEN                                       
005000         MOVE IN-RECORD TO OUT-RECORD                             
005100         ADD 1 TO WS-WRITE-CNT                                    
005200             ON SIZE ERROR DISPLAY 'WRITE COUNTER OVERFLOW'       
005300         WRITE OUT-RECORD                                         
005400         PERFORM 9100-CHECK-OUT-STATUS                            
005500     END-IF.                                                      
005600     PERFORM 2100-READ-IN-FILE.                                   
005700 2100-READ-IN-FILE.                                               
005800     READ IN-FILE                                                 
005900         AT END SET WS-IN-EOF TO TRUE                             
006000         NOT AT END ADD 1 TO WS-READ-CNT                          
006100             ON SIZE ERROR DISPLAY 'READ COUNTER OVERFLOW'        
006200     END-READ.                                                    
006300     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
006400         PERFORM 9000-CHECK-IN-STATUS                             
006500     END-IF.                                                      
006600 3000-TERMINATE.                                                  
006700     CLOSE IN-FILE.                                               
006800     PERFORM 9000-CHECK-IN-STATUS.                                
006900     CLOSE OUT-FILE.                                              
007000     PERFORM 9100-CHECK-OUT-STATUS.                               
007100     DISPLAY 'CBLSL002 COMPLETED. READ: ' WS-READ-CNT ' WRITE: ' WS-WRITE-CNT.
007200 9000-CHECK-IN-STATUS.                                            
007300     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
007400         DISPLAY 'FATAL ERROR ON IN-FILE STATUS: ' WS-IN-STATUS   
007500         MOVE 16 TO RETURN-CODE                                   
007600         STOP RUN                                                 
007700     END-IF.                                                      
007800 9100-CHECK-OUT-STATUS.                                           
007900     IF NOT WS-OUT-OK THEN                                        
008000         DISPLAY 'FATAL ERROR ON OUT-FILE STATUS: ' WS-OUT-STATUS 
008100         MOVE 16 TO RETURN-CODE                                   
008200         STOP RUN                                                 
008300     END-IF.                                                      
