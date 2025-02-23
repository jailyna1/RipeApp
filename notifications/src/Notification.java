public class Notification {

    private String[] messages;
    private int daysUntil;
    private ButtonForNotif[] buttons = new ButtonForNotif[5];

    public Notification() {
    }

    public int getDaysUntil() {
        return daysUntil;
    }

    public void setDaysUntil(int daysUntil) {
        this.daysUntil = daysUntil;
    }

    public String[] getMessages() {
        return messages;
    }

    public void setMessages(String[] messages) {
        int count = 0;
        for (int i = 0; i < buttons.length; i++) {
            if (buttons[i].isChecked()) {
                switch (i) {
                    case 0:
                        setDaysUntil(14);
                        break;
                    case 1:
                        setDaysUntil(7);
                        break;
                    case 2:
                        setDaysUntil(3);
                        break;
                    case 3:
                        setDaysUntil(1);
                        break;
                    case 4:
                        setDaysUntil(0);
                        //This 'days until' case would take the user input from the custom notifications
                    default:
                        break;
                }

                if (daysUntil == 1) {
                    messages[count] = "You have " + daysUntil + " day until your food expires.";
                } else {
                    messages[count] = "You have " + daysUntil + " days until your food expires.";
                }
                count++;
            }
        }
    }
}