package entities;

import java.awt.Color;
import java.awt.Graphics;

public class Apple {
	
	private int xCoor, yCoor, width, height;
	
	public Apple( int xCoor, int yCoor, int tileSize) {
		
		this.xCoor = xCoor;
		this.yCoor = yCoor;
		width = tileSize;
		height = tileSize + 2;
		
	}
	
	public void tick() {
		
		
		
	}
	
	public int getxCoor() {
		return xCoor;
	}

	public void setxCoor(int xCoor) {
		this.xCoor = xCoor;
	}

	public int getyCoor() {
		return yCoor;
	}

	public void setyCoor(int yCoor) {
		this.yCoor = yCoor;
	}
	
	public void draw(Graphics g) {
		
		//g.setColor(Color.RED);
		g.setColor(Color.BLACK);
		
		//g.fillRect(xCoor * width,  yCoor * height,  width,  height);
		
		g.fillRect(xCoor * width - 00,  yCoor * height + 12,  width,  height);
		g.fillRect(xCoor * width + 00,  yCoor * height - 12,  width,  height);
		g.fillRect(xCoor * width - 10,  yCoor * height + 00,  width,  height);
		g.fillRect(xCoor * width + 10,  yCoor * height - 00,  width,  height);
		
	}

}
