package entities;

import java.awt.Color;
import java.awt.Graphics;

import Snake.graphics.Screen;

public class BodyParts {
	
	private int xCoor, yCoor, width, height;

	
	public BodyParts(int xCoor, int yCoor, int tileSize) {
		
		this.xCoor = xCoor;
		this.yCoor = yCoor;
		width = tileSize;
		height = tileSize + 2;
		
	}
	
	public void tick() {
		
		
	}
	
	public void drawHead0(Graphics g) 	{ head0(g); }
	public void drawHead1(Graphics g) 	{ head1(g); }
	public void drawHead2(Graphics g) 	{ head2(g); }
	public void drawHead3(Graphics g) 	{ head3(g); }
	
	
	public void draw1(Graphics g) 		{ part1(g); }	
	public void draw2(Graphics g) 		{ part2(g); }	
	public void draw3(Graphics g) 		{ part3(g); }	
	public void draw4(Graphics g) 		{ part4(g); }	
	public void draw5(Graphics g) 		{ part5(g); }	
	public void draw6(Graphics g) 		{ part6(g); }	
	public void draw7(Graphics g) 		{ part7(g); }	
	public void draw8(Graphics g) 		{ part8(g); }
	
	
	
	public void part1(Graphics g) {															//      -4-3-2-1 0 1 2
																							//     0  []
		g.setColor(Color.BLACK);															//	   1[][]
		
		g.fillRect(yCoor * width + width * -4,  xCoor * height + height * 1,  width,  height);
		
		g.fillRect(yCoor * width + width * -3,  xCoor * height + height * 0,  width,  height);
		g.fillRect(yCoor * width + width * -3,  xCoor * height + height * 1,  width,  height);
	
	}
	
	public void part2(Graphics g) {															//    -6-5-4-3-2-1 0
																							//   0[][]  
		g.setColor(Color.BLACK);															//	  []
		
		g.fillRect(yCoor * width + width * -6,  xCoor * height + height * 0,  width,  height);
		g.fillRect(yCoor * width + width * -6,  xCoor * height + height * 1,  width,  height);
		
		g.fillRect(yCoor * width + width * -5,  xCoor * height + height * 0,  width,  height);

	}
	
	public void part3(Graphics g) {															//       0 1 2 3 4 5 6 
																							//     0          [][]
		g.setColor(Color.BLACK);															//		            []
		
		g.fillRect(yCoor * width + width * 5,  xCoor * height + height * 0,  width,  height);
		
		g.fillRect(yCoor * width + width * 6,  xCoor * height + height * 0,  width,  height);
		g.fillRect(yCoor * width + width * 6,  xCoor * height + height * 1,  width,  height);
		
		}
		
	public void part4(Graphics g) {														    //     0 1 2 3 4 5 6 7
																							//   0      []  
		g.setColor(Color.BLACK);															//	 1      [][]
		
		g.fillRect(yCoor * width + width * 3,  xCoor * height + height * 0,  width,  height);
		g.fillRect(yCoor * width + width * 3,  xCoor * height + height * 1,  width,  height);
		
		g.fillRect(yCoor * width + width * 4,  xCoor * height + height * 1,  width,  height);
		
		}
	
	public void part5(Graphics g) {															//       0 1
																							//     3[][]    
		g.setColor(Color.BLACK);															//	   4  []  
																							//	   5
		
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 3,  width,  height);
		
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 3,  width,  height);
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 4,  width,  height);
		
		}
		
	public void part6(Graphics g) {														    //       0 1
																							//     5[] 
		g.setColor(Color.BLACK);															//	   6[][]
																							//     7
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 5,  width,  height);
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 6,  width,  height);
		
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 6,  width,  height);
		
	}

	public void part7(Graphics g) {														   	//       0 1
																							//    -4  [] 
		g.setColor(Color.BLACK);															//	  -3[][]
																							//    -2
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * -3,  width,  height);
		
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * -4,  width,  height);
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * -3,  width,  height);

	}
	
	public void part8(Graphics g) {															//       0 1
																							//    -6[][]    
		g.setColor(Color.BLACK);															//	  -5[]   
																							//	  -4
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * -6,  width,  height);
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * -5,  width,  height);
		
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * -6,  width,  height);
		
	}
	
	/* Head Parts 
	 * **************************************************************************************************************** */

	public void head0(Graphics g) {	
		
		g.setColor(Color.BLACK);
		
		g.fillRect(yCoor * width + width * -4,  xCoor * height + height * 1,  width,  height);	//   -4-3-2-1 0 1 2 3 4
																								// -1    []
		g.fillRect(yCoor * width + width * -3,  xCoor * height + height * 0,  width,  height);	// 	0  []  [][]    
		g.fillRect(yCoor * width + width * -3,  xCoor * height + height * 1,  width,  height);	// 	1[][][][][]
																								//	2
		g.fillRect(yCoor * width + width * -2,  xCoor * height + height * -1, width,  height);	// 	3
		g.fillRect(yCoor * width + width * -2,  xCoor * height + height * 1,  width,  height);	//  4          
		
		g.fillRect(yCoor * width + width * -1,  xCoor * height + height * 0,  width,  height);       
		g.fillRect(yCoor * width + width * -1,  xCoor * height + height * 1,  width,  height);
		
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 0,  width,  height);
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 1,  width,  height);
		
		
	}
	
	public void head1(Graphics g) {
		
		g.setColor(Color.BLACK);																//   0 1 2 3 4
																								// -1    []
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 0,  width,  height);	// 	0[][]  []      
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 1,  width,  height);	// 	1[][][][][]
																								//	2
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 0, width,  height);	// 	3
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 1,  width,  height);	//  4          
		
		g.fillRect(yCoor * width + width * 2,  xCoor * height + height * -1,  width,  height);       
		g.fillRect(yCoor * width + width * 2,  xCoor * height + height * 1,  width,  height);
		
		g.fillRect(yCoor * width + width * 3,  xCoor * height + height * 0,  width,  height);
		g.fillRect(yCoor * width + width * 3,  xCoor * height + height * 1,  width,  height);	
		
		g.fillRect(yCoor * width + width * 4,  xCoor * height + height * 1,  width,  height);	
		
	}
	
	public void head2(Graphics g) {
		
		g.setColor(Color.BLACK);																//   -1 0 1 2 3 4
																								//  0  [][]
		g.fillRect(yCoor * width + width * -1,  xCoor * height + height * 2,  width,  height);	//  1  [][]
																								// 	2[]  []
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 0, width,  height);	//	3  [][]
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 1, width,  height);	// 	4    []
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 3,  width,  height);	//  5          
		
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 0,  width,  height);       
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 1,  width,  height);
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 2,  width,  height);
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 3,  width,  height);			
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 4,  width,  height);	
		
	}
	
	public void head3(Graphics g) {
		
		g.setColor(Color.BLACK);																//   -1 0 1 2 3 4
																								// -4    []
		g.fillRect(yCoor * width + width * -1,  xCoor * height + height * -2,  width,  height);	// -3  [][]
																								// -2[]  []
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * -3, width,  height);	// -1  [][]
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * -1, width,  height);	// 	0  [][]
		g.fillRect(yCoor * width + width * 0,  xCoor * height + height * 0,  width,  height);	//  1          
		
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * -4,  width,  height);       
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * -3,  width,  height);
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * -2,  width,  height);
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * -1,  width,  height);			
		g.fillRect(yCoor * width + width * 1,  xCoor * height + height * 0,  width,  height);	
		
	}
	
}
