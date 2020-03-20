'use strict';
var femmodel = require("femmodel");  

module.exports = function( ) {  
    this._modeldata; 
    this._myModel; 

    this.setModel = function( theModel )   
    {
        var self = this; 
        self._modeldata = theModel._modeldata
        self._myModel = theModel;
    }
    // constructing bar element stiffness matrix 
    this.calcElmStiffMatr = function( elemID )   
    {
        var self = this;         
        var theElm = self._modeldata["elements"][elemID]; 
        var nodesIDList = theElm["node"]; 
        var area = theElm["area"]; 
        
        var mateType = theElm["material"];
        //console.log("spring mateType:", mateType );

        var material = self._modeldata["materials"][mateType]; 
        var E = parseFloat( material["E"]);  
        var result = self._myModel.checkingObject( E );  
        if(! Boolean( result ))
        {
            console.error("bar(): invalid E");
            return;
        }   
        
        var lenVector = self._myModel.calcuTwoNodeVector(nodesIDList[0], nodesIDList[1]);
        var len = lenVector[0];
        var k = parseFloat(E) * parseFloat(area) / parseFloat(len) ;
        var K_e = [[ k, -k], [-k, k]];       

        var PM = [
            [lenVector[1], lenVector[2], lenVector[3], 0.0, 0.0, 0.0 ], 
            [0.0, 0.0, 0.0, lenVector[1], lenVector[2], lenVector[3]]
        ];

        var PM_T = numeric.transpose( PM );
        var tmp = numeric.dot( PM_T, K_e ); 
        var K = numeric.dot( tmp, PM );

        return K;
    }

    this.barStress = function( elemID )   
    {
        var self = this;         
        var theElm = self._modeldata["elements"][elemID]; 
        var nodesIDList = theElm["node"]; 
        var area = theElm["area"]; 

        var lenVector = self._myModel.calcuTwoNodeVector(nodesIDList[0], nodesIDList[1]);
        var len = lenVector[0];
        var PM = [
            [lenVector[1], lenVector[2], lenVector[3], 0.0, 0.0, 0.0 ], 
            [0.0, 0.0, 0.0, lenVector[1], lenVector[2], lenVector[3]]
        ]; 

        var bar_dof_id_list = [];
        var bar_dof_index = 0;
        for( var item in nodesIDList ) 
        {
            var nodeID = nodesIDList[item];
            var theNode = self._modeldata["nodes"][String(parseInt(nodeID))]; 
            var dofID =  theNode["dofID"];
            var dofs =  theNode["dof"];
            var i = 0;
            for( var it in dofs )
            {
                var bar_dof_global_index = dofID + i;
                bar_dof_id_list[bar_dof_index] = bar_dof_global_index;
                i++;
                bar_dof_index++;
            }
        }

        var bar_u = [];
        bar_dof_index = 0;
        for( var item in bar_dof_id_list ) 
        {
            var id = bar_dof_id_list[item]; 
            bar_u[bar_dof_index] = self._U[id];
            bar_dof_index++;
        }

        var tmp = numeric.dot( PM, bar_u ); 

        var B = [-1.0/len, 1.0/len];

        var mateType = theElm["material"];
        var material = self._modeldata["materials"][mateType]; 
        var E = parseFloat( material["E"]); 
 
        var stress = numeric.dot( B, tmp ); 
        stress *= E;

        return stress;
    }    
}        