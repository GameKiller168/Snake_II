package entities;

import java.awt.Color;
import java.awt.Graphics;

public class Display {
	
public static void Num0(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos, 0, 10, 60); g.fillRect(pos, 0, 20, 12); g.fillRect(pos + 20, 0, 10, 60); g.fillRect(pos, 48, 30, 12);

	}
	
	public static void Num1(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos + 20, 0, 10, 60); g.fillRect(pos + 10, 12, 10, 12);

	}
	
	public static void Num2(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos, 24, 10, 36); g.fillRect(pos, 0, 20, 12); g.fillRect(pos + 20, 0, 10, 30); g.fillRect(pos, 24, 30, 12); g.fillRect(pos, 48, 30, 12);

	}
	
	public static void Num3(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos, 0, 20, 12); g.fillRect(pos + 20, 0, 10, 60); g.fillRect(pos, 24, 30, 12); g.fillRect(pos, 48, 30, 12);

	}
	
	public static void Num4(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos, 0, 10, 30); g.fillRect(pos + 20, 0, 10, 60); g.fillRect(pos, 24, 30, 12);

	}
	
	public static void Num5(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos, 0, 10, 30); g.fillRect(pos, 0, 30, 12); g.fillRect(pos + 20, 24, 10, 30); g.fillRect(pos, 24, 30, 12); g.fillRect(pos, 48, 30, 12);

	}
	
	public static void Num6(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos, 0, 10, 60); g.fillRect(pos, 0, 30, 12); g.fillRect(pos + 20, 24, 10, 30); g.fillRect(pos, 24, 30, 12); g.fillRect(pos, 48, 30, 12);

	}
	
	public static void Num7(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(20 + pos, 0, 10, 60); g.fillRect(pos, 0, 30, 12);

	}

	public static void Num8(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos, 0, 10, 60); g.fillRect(pos, 0, 20, 12); g.fillRect(pos + 20, 0, 10, 60); g.fillRect(pos, 24, 30, 12); g.fillRect(pos, 48, 30, 12);

	}
	
	public static void Num9(Graphics g, int pos) {
		
		pos = pos * 10;
	
		g.setColor(Color.BLACK);
	
		g.fillRect(pos, 0, 10, 30); g.fillRect(pos, 0, 20, 12); g.fillRect(pos + 20, 0, 10, 60); g.fillRect(pos, 24, 30, 12); g.fillRect(pos, 48, 30, 12);

	}

}
