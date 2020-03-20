'use strict';

module.exports = function( ) {  
    this._modeldata;

    this.setModel = function( theModel )   
    {
        var self = this; 
        self._modeldata = theModel._modeldata
    }
    // constructing EB beam element stiffness matrix 
    this.calcElmStiffMatr = function( elemID )   
    {
        var self = this; 
        
        var theElm = self._modeldata["elements"][elemID]; 
        var nodesIDList = theElm["node"];
        //console.log("nodes:", nodes );

        var mateType = theElm["material"];
        //console.log("spring mateType:", mateType );

        var material = self._modeldata["materials"][mateType]; 
        var k = parseFloat( material["k"]); 
        //console.log("spring k:", k );
        var K_e = [[ k, -k], [-k, k]]; 

        var n_1 = self._modeldata["nodes"][ String(nodesIDList[0]) ];
        var n_2 = self._modeldata["nodes"][ String(nodesIDList[1]) ];

        var dx = parseFloat(n_2["coords"]["x"]) - parseFloat(n_1["coords"]["x"]);
        var dy = parseFloat(n_2["coords"]["y"]) - parseFloat(n_1["coords"]["y"]);
        var dz = parseFloat(n_2["coords"]["z"]) - parseFloat(n_1["coords"]["z"]);

        var d = [ dx, dy, dz];
        var len = Math.sqrt( d[0]*d[0] + d[1]*d[1] + d[2]*d[2] ); 

        var c_alpha = d[0] / len; 
        //s_alpha = Math.sqrt( 1 - c_alpha * c_alpha );
        var c_beta = d[1] / len; 
        //s_beta = Math.sqrt( 1 - c_beta * c_beta );
        var c_gamma = d[2] / len; 
        //s_gamma = Math.sqrt( 1 - c_gamma * c_gamma );
        
        var PM = [
            [c_alpha, c_beta, c_gamma, 0.0, 0.0, 0.0 ], 
            [0.0, 0.0, 0.0, c_alpha, c_beta, c_gamma]
        ];

        var PM_T = numeric.transpose( PM );
        var tmp = numeric.dot( PM_T, K_e ); 
        var K = numeric.dot( tmp, PM );

        return K;        
    }
}        
