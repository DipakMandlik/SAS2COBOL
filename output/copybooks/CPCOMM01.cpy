000100*================================================================*
000200* CPCOMM01: COMMON CONTROL AND STATUS BLOCK                       *
000300*================================================================*
000400 01  WS-COMMON-HEADER.
000500     05  WS-PROGRAM-NAME              PIC X(8)  VALUE 'CBLSL001'.
000600     05  WS-SYSTEM-DATE                PIC 9(8)  VALUE ZERO.
000700     05  WS-SYSTEM-TIME                PIC 9(6)  VALUE ZERO.
000800     05  WS-RETURN-CODE                PIC S9(4) COMP VALUE ZERO.
000900     05  WS-ABEND-CODE                 PIC S9(4) COMP VALUE ZERO.
001000     05  WS-FILE-STATUS-BLOCK.
001100         10  WS-FILE-STATUS            PIC X(2)  VALUE '00'.
001200             88  WS-FILE-OK            VALUE '00'.
001300             88  WS-FILE-EOF           VALUE '10'.
001400             88  WS-FILE-NOT-FOUND     VALUE '23'.
001500             88  WS-FILE-DUP-KEY       VALUE '22'.
001600     05  WS-RECON-COUNTERS.
001700         10  WS-READ-COUNT             PIC S9(9) COMP-3 VALUE ZERO.
001800         10  WS-WRITE-COUNT            PIC S9(9) COMP-3 VALUE ZERO.
001900         10  WS-REJECT-COUNT           PIC S9(9) COMP-3 VALUE ZERO.
002000         10  WS-TOTAL-AMOUNT           PIC S9(13)V99 COMP-3 VALUE ZERO.
