package Snake.graphics;

import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Random;
import java.awt.Color;

import javax.swing.JPanel;

import entities.Apple;
import entities.BodyParts;
import entities.Display;

public class Screen extends JPanel implements Runnable{
	
	private static final long serialVersionUID = 1L;
	
	public static final int WIDTH = 841, HEIGHT = 576;
	private Thread thread;
	private boolean running = false;
	
	int lenNum = 0;
	
	private Random r;
	
	private int t = 5000;
	
	int lastPressed = 0;
	
	private BodyParts b;
	private ArrayList<BodyParts> snake;
	
	private Apple apple;
	private ArrayList<Apple> apples;
	
	private int xCoor = 7, yCoor = 31;
	private int size = 9;
	
	int Score = 0;
	
	ArrayList<Integer> orArray = new ArrayList<>(size);
	
	public static boolean right = true;

	public static boolean left = false;

	public static boolean up = false;

	public static boolean down = false;
	
	private Key key;
	
	private int ticks = 0;
	
	public Screen() {
		
		setFocusable(true);
		key = new Key();
		addKeyListener(key);
		
		setPreferredSize(new Dimension(WIDTH, HEIGHT));
		
		r = new Random();
		
		snake = new ArrayList<BodyParts>();
		apples = new ArrayList<Apple>();
		
		start();
		
	}
	
	public void start() {
		
		running = true;
		thread = new Thread(this, "GameLoop");
		thread.start();
		
	}
	
	public void stop() {
				
	}

	private static int getRandomX() {
		
		int[] arrayX = {3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 71, 75};
		
		int rnd = new Random().nextInt(arrayX.length);
		return arrayX[rnd];
		
	}
	
	private static int getRandomY() {
		
		int[] arrayY = {11, 15, 19, 23, 27, 31, 35, 39};
		
		int rnd = new Random().nextInt(arrayY.length);
		return arrayY[rnd];
		
	}
	
	public void tick() {
		
		if (snake.size() == 0) {
			
			b = new BodyParts(yCoor, xCoor, 10);
			snake.add(b);			
		}
		
		if (apples.size() == 0) {
			
			int xCoor = getRandomX();
			int yCoor = getRandomY();
			
			System.out.println("alma: " + xCoor + " - " + yCoor);
			
			Score = (size - 9) * 4;
			
			System.out.println("Score: " + Score);
			
			System.out.println();
			
			lenNum = String.valueOf(Score).length();

			apple = new Apple(xCoor, yCoor, 10);
			apples.add(apple);
			
		}
		
		for ( int i = 0; i < apples.size(); i++) {
			
			if ( xCoor == apples.get(i).getxCoor() && yCoor == apples.get(i).getyCoor()) {
				
				size++;
				apples.remove(i);
				i--; }
			
		}
		
		ticks++;
		
		if(ticks > t) {
			
			if(right) 	xCoor += 4;
			if(left) 	xCoor -= 4;
			if(up) 		yCoor -= 4;
			if(down) 	yCoor += 4;
			
			orArray.add(lastPressed);
			
			if (size < orArray.size()) orArray.remove(0);
			
			ticks = 0;
			
			b = new BodyParts(yCoor, xCoor, 10);

			snake.add(b);

			if(snake.size() > size) {snake.remove(0); t = 5000000;}
			
		}
		
	}
	

	

	public void paint(Graphics g) {
		
		g.clearRect(0, 0, WIDTH, HEIGHT);
		
		g.setColor(Color.GREEN);
		g.fillRect(0, 0, WIDTH, HEIGHT);
		
		/* 0-s in front of the Score */
		/************************************************************************/
		
		if (Score == 0) { for (int i = 0; i < 13 ; i += 4) {Display.Num0(g, i);}}
		
		if (Score != 0 && lenNum == 1) { for (int i = 0; i < 12 ; i += 4) {Display.Num0(g, i);}}
		
		if (lenNum == 2) { for (int i = 0; i < 8 ; i += 4) {Display.Num0(g, i);}}
		
		if (lenNum == 3) { for (int i = 0; i < 4 ; i += 4) {Display.Num0(g, i);}}
		
		/************************************************************************/
		
		ArrayList<Integer> ScoreArray = new ArrayList<>(4);
		
		int tempScore = Score;
	
		while (tempScore > 0) { ScoreArray.add(tempScore % 10); tempScore = tempScore / 10; }
		
		Collections.reverse(ScoreArray);
		
		/* Score display 
		 * ********************************************************************* */
		
		for ( int i = ScoreArray.size() - 1; i >= 0 ; i--) {
			
				if (ScoreArray.get(i) == 0) {Display.Num0(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 1) {Display.Num1(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 2) {Display.Num2(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 3) {Display.Num3(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 4) {Display.Num4(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 5) {Display.Num5(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 6) {Display.Num6(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 7) {Display.Num7(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 8) {Display.Num8(g, (5 - lenNum + i - 1) * 4);}
				if (ScoreArray.get(i) == 9) {Display.Num9(g, (5 - lenNum + i - 1) * 4);}
				
	
		}
		
		for (int i = 0; i < apples.size(); i++) {
					
			apples.get(i).draw(g);
					
				}
		
		for(int i = 0; i < HEIGHT; i++) {
			
			g.setColor(Color.GREEN);
			
			g.drawLine(0, i * 12, WIDTH, i * 12);
			
		}
		
		/* movement graphics
		 * *************************************************************************************** */
		
		for(int i = 1; i < snake.size(); i++) {	
			
/* Head R */	if (orArray.get(snake.size() - 1) == 0) {snake.get(snake.size() - 1).drawHead0(g);}
/* Head L */	if (orArray.get(snake.size() - 1) == 1) {snake.get(snake.size() - 1).drawHead1(g);}
/* Head U */	if (orArray.get(snake.size() - 1) == 2) {snake.get(snake.size() - 1).drawHead2(g);}
/* Head D */	if (orArray.get(snake.size() - 1) == 3) {snake.get(snake.size() - 1).drawHead3(g);}
			
/* Move R */	if (orArray.get(i) == 0) { snake.get(i).draw1(g); snake.get(i).draw2(g); }
/* Move L */	if (orArray.get(i) == 1) { snake.get(i).draw3(g); snake.get(i).draw4(g); }
/* Move U */	if (orArray.get(i) == 2) { snake.get(i).draw5(g); snake.get(i).draw6(g); }
/* Move D */	if (orArray.get(i) == 3) { snake.get(i).draw7(g); snake.get(i).draw8(g); }
				
		}
		
		/* *************************************************************************************** */
		
		g.setColor(Color.BLACK);
		
		g.fillRect(0, 96, 10, 480);
		g.fillRect(0, 564, 996, 12);
		g.fillRect(831, 96, 10, 480);
		g.fillRect(0, 96, 996, 12);
		g.fillRect(0, 72, 996, 12);
		
		g.setColor(Color.GREEN);
		
		for(int i = 0; i < WIDTH / 10; i++) {
			
			g.drawLine(i * 10, 0, i * 10, HEIGHT);
			
		}
		
		for(int i = 0; i < HEIGHT; i++) {
			
			g.setColor(Color.GREEN);
			
			g.drawLine(0, i * 12, WIDTH, i * 12);
			
		}
		
	}

	public void run() {
		
		while(running) {
			
			tick();
			repaint();
			
		}
		
	}
	
	private class Key implements KeyListener {

		

		public void keyPressed(KeyEvent e) {
			
			int key = e.getKeyCode();
			
			if(key == KeyEvent.VK_RIGHT && !left) {
				
				//System.out.println("right");
				
				right 	= true;
				up		= false;
				down 	= false;
				
				lastPressed = 0;
				
			}
			
			if(key == KeyEvent.VK_LEFT && !right) {
				
				//System.out.println("left");
							
				left 	= true;			
				up 		= false;
				down 	= false;
								
				lastPressed = 1;
				
						}
			
			if(key == KeyEvent.VK_UP && !down) {
				
				//System.out.println("up");
							
				up 		= true;
				right 	= false;
				left 	= false;
							
				lastPressed = 2;
				
						}
			
			if(key == KeyEvent.VK_DOWN && !up) {
				
				//System.out.println("down");
				
				down 	= true;
				right 	= false;
				left 	= false;
				
				lastPressed = 3;
				
			}
			
		}

		public void keyReleased(KeyEvent e) {}

		public void keyTyped(KeyEvent e) {}
	
	}

}
